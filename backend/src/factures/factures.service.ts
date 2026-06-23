import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from '../common/pdf.service';
import {
  calculerFactureVente,
  formatNumeroFacture,
} from '../common/facture.utils';
import { generateFactureVentePdf } from '../common/facture-pdf.generator';
import {
  CreateFactureAchatDto,
  CreateFactureVenteDto,
} from './dto/create-facture.dto';
import {
  UpdateFactureDto,
  UpdateFactureVenteDto,
} from './dto/update-facture.dto';

const DEFAULTS = {
  codeClient: 'OX704',
  telephone: '0662 176 292',
  mail: 'contact@oxyral.ma',
};

const DEFAULTS_CHIMIRAL = {
  codeClient: 'CH704',
  telephone: '05 22 33 29 05',
  mail: 'chimiral@oxyral.ma',
};

@Injectable()
export class FacturesService {
  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
  ) {}

  private venteInclude = {
    client: true,
    lignes: { orderBy: { ordre: 'asc' as const } },
  };

  private async getNextSequence(annee: number, societe: string = 'OXYRAL'): Promise<number> {
    const isOxyral = societe === 'OXYRAL';
    const cle = isOxyral ? `vente_seq_${annee}` : `vente_seq_${societe.toLowerCase()}_${annee}`;
    const existing = await this.prisma.factureConfig.findUnique({ where: { cle } });
    if (existing) return parseInt(existing.valeur, 10) + 1;

    const last = await this.prisma.factureVente.findFirst({
      where: {
        numeroFacture: { startsWith: `${annee}/` },
        societe,
      },
      orderBy: { numeroFacture: 'desc' },
    });
    if (!last) return 1;
    const part = last.numeroFacture.split('/')[1];
    return (parseInt(part, 10) || 0) + 1;
  }

  async getProchainNumero(annee?: number, societe: string = 'OXYRAL') {
    const year = annee ?? new Date().getFullYear();
    const sequence = await this.getNextSequence(year, societe);
    const isOxyral = societe === 'OXYRAL';
    const cle = isOxyral ? `vente_seq_${year}` : `vente_seq_${societe.toLowerCase()}_${year}`;
    const config = await this.prisma.factureConfig.findUnique({
      where: { cle },
    });
    return {
      annee: year,
      sequence,
      numeroFacture: formatNumeroFacture(year, sequence),
      sequenceConfigurable: config ? parseInt(config.valeur, 10) : sequence - 1,
    };
  }

  async setSequence(annee: number, sequence: number, societe: string = 'OXYRAL') {
    const isOxyral = societe === 'OXYRAL';
    const cle = isOxyral ? `vente_seq_${annee}` : `vente_seq_${societe.toLowerCase()}_${annee}`;
    await this.prisma.factureConfig.upsert({
      where: { cle },
      create: { cle, valeur: String(sequence) },
      update: { valeur: String(sequence) },
    });
    return this.getProchainNumero(annee, societe);
  }

  private async reserveNumero(annee: number, numeroForce?: string, societe: string = 'OXYRAL'): Promise<string> {
    const isOxyral = societe === 'OXYRAL';
    const cle = isOxyral ? `vente_seq_${annee}` : `vente_seq_${societe.toLowerCase()}_${annee}`;
    if (numeroForce) {
      const part = numeroForce.split('/')[1];
      const seq = parseInt(part, 10);
      if (seq) {
        await this.prisma.factureConfig.upsert({
          where: { cle },
          create: { cle, valeur: String(seq) },
          update: { valeur: String(seq) },
        });
      }
      return numeroForce;
    }
    const sequence = await this.getNextSequence(annee, societe);
    const numero = formatNumeroFacture(annee, sequence);
    await this.prisma.factureConfig.upsert({
      where: { cle },
      create: { cle, valeur: String(sequence) },
      update: { valeur: String(sequence) },
    });
    return numero;
  }

  // --- Factures Achat ---
  findAllAchat(filters?: { search?: string; dateDebut?: string; dateFin?: string }) {
    const where: any = {};
    if (filters?.search) {
      where.OR = [
        { numeroFacture: { contains: filters.search } },
        { fournisseur: { nomFournisseur: { contains: filters.search } } },
      ];
    }
    if (filters?.dateDebut || filters?.dateFin) {
      where.dateFacture = {};
      if (filters.dateDebut) where.dateFacture.gte = new Date(filters.dateDebut);
      if (filters.dateFin) where.dateFacture.lte = new Date(filters.dateFin);
    }
    return this.prisma.factureAchat.findMany({
      where,
      include: { fournisseur: true },
      orderBy: { dateFacture: 'desc' },
    });
  }

  async createAchat(dto: CreateFactureAchatDto) {
    const facture = await this.prisma.factureAchat.create({
      data: {
        fournisseurId: dto.fournisseurId,
        numeroFacture: dto.numeroFacture,
        dateFacture: new Date(dto.dateFacture),
        montant: dto.montant,
      },
      include: { fournisseur: true },
    });
    const pdfPath = await this.generateFactureAchatPdf(facture);
    return this.prisma.factureAchat.update({
      where: { id: facture.id },
      data: { pdfPath },
      include: { fournisseur: true },
    });
  }

  async updateAchat(id: number, dto: UpdateFactureDto) {
    const existing = await this.prisma.factureAchat.findUnique({
      where: { id },
      include: { fournisseur: true },
    });
    if (!existing) throw new NotFoundException('Facture achat non trouvée');

    const facture = await this.prisma.factureAchat.update({
      where: { id },
      data: {
        ...dto,
        dateFacture: dto.dateFacture ? new Date(dto.dateFacture) : undefined,
      },
      include: { fournisseur: true },
    });
    const pdfPath = await this.generateFactureAchatPdf(facture);
    return this.prisma.factureAchat.update({
      where: { id },
      data: { pdfPath },
      include: { fournisseur: true },
    });
  }

  async removeAchat(id: number) {
    const facture = await this.prisma.factureAchat.findUnique({ where: { id } });
    if (!facture) throw new NotFoundException('Facture achat non trouvée');
    return this.prisma.factureAchat.delete({ where: { id } });
  }

  // --- Factures Vente OXYRAL ---
  findAllVente(filters?: { search?: string; dateDebut?: string; dateFin?: string; societe?: string }) {
    const where: any = {};
    if (filters?.societe) {
      where.societe = filters.societe;
    }
    if (filters?.search) {
      where.OR = [
        { numeroFacture: { contains: filters.search } },
        { clientNom: { contains: filters.search } },
        { client: { nomClient: { contains: filters.search } } },
      ];
    }
    if (filters?.dateDebut || filters?.dateFin) {
      where.dateFacture = {};
      if (filters.dateDebut) where.dateFacture.gte = new Date(filters.dateDebut);
      if (filters.dateFin) where.dateFacture.lte = new Date(filters.dateFin);
    }
    return this.prisma.factureVente.findMany({
      where,
      include: this.venteInclude,
      orderBy: { dateFacture: 'desc' },
    });
  }

  async findOneVente(id: number) {
    const facture = await this.prisma.factureVente.findUnique({
      where: { id },
      include: this.venteInclude,
    });
    if (!facture) throw new NotFoundException('Facture vente non trouvée');
    return facture;
  }

  calculerPreview(lignes: { designation: string; quantite: number; prixUnitaire: number }[]) {
    if (!lignes?.length) {
      throw new BadRequestException('Ajoutez au moins une ligne de prestation');
    }
    return calculerFactureVente(lignes);
  }

  async createVente(dto: CreateFactureVenteDto) {
    if (!dto.lignes?.length) {
      throw new BadRequestException('Ajoutez au moins une ligne de prestation');
    }
    const societe = dto.societe || 'OXYRAL';
    const defaults = societe === 'CHIMIRAL' ? DEFAULTS_CHIMIRAL : DEFAULTS;

    const totaux = calculerFactureVente(dto.lignes);
    const dateFacture = new Date(dto.dateFacture);
    const annee = dateFacture.getFullYear();
    const numeroFacture = await this.reserveNumero(annee, dto.numeroFacture, societe);

    const facture = await this.prisma.factureVente.create({
      data: {
        clientId: dto.clientId,
        numeroFacture,
        dateFacture,
        montant: totaux.totalTtc,
        telephone: dto.telephone || defaults.telephone,
        mail: dto.mail || defaults.mail,
        clientNom: dto.clientNom,
        clientAdresse: dto.clientAdresse || '',
        clientIce: dto.clientIce,
        codeClient: dto.codeClient ?? defaults.codeClient,
        bonCommande: dto.bonCommande,
        numeroAttach: dto.numeroAttach,
        conditionPaiement: dto.conditionPaiement,
        totalHt: totaux.totalHt,
        totalTva: totaux.totalTva,
        totalTtc: totaux.totalTtc,
        montantEnLettres: totaux.montantEnLettres,
        societe,
        chantier: dto.chantier,
        lignes: {
          create: totaux.lignes.map((l, i) => ({
            designation: l.designation,
            quantite: l.quantite,
            prixUnitaire: l.prixUnitaire,
            montantHt: l.montantHt,
            ordre: i,
          })),
        },
      },
      include: this.venteInclude,
    });

    const pdfPath = await this.generateFactureVentePdfFile(facture);
    return this.prisma.factureVente.update({
      where: { id: facture.id },
      data: { pdfPath },
      include: this.venteInclude,
    });
  }

  async updateVente(id: number, dto: UpdateFactureVenteDto) {
    const existing = await this.findOneVente(id);
    const defaults = existing.societe === 'CHIMIRAL' ? DEFAULTS_CHIMIRAL : DEFAULTS;

    let totaux = {
      totalHt: Number(existing.totalHt),
      totalTva: Number(existing.totalTva),
      totalTtc: Number(existing.totalTtc),
      montantEnLettres: existing.montantEnLettres ?? '',
      lignes: existing.lignes.map((l) => ({
        designation: l.designation,
        quantite: Number(l.quantite),
        prixUnitaire: Number(l.prixUnitaire),
        montantHt: Number(l.montantHt),
      })),
    };

    if (dto.lignes) {
      if (!dto.lignes.length) {
        throw new BadRequestException('Ajoutez au moins une ligne de prestation');
      }
      totaux = calculerFactureVente(dto.lignes);
      await this.prisma.factureVenteLigne.deleteMany({ where: { factureId: id } });
    }

    const facture = await this.prisma.factureVente.update({
      where: { id },
      data: {
        numeroFacture: dto.numeroFacture,
        dateFacture: dto.dateFacture ? new Date(dto.dateFacture) : undefined,
        telephone: dto.telephone || defaults.telephone,
        mail: dto.mail || defaults.mail,
        clientNom: dto.clientNom,
        clientAdresse: dto.clientAdresse || '',
        clientIce: dto.clientIce,
        codeClient: dto.codeClient,
        bonCommande: dto.bonCommande,
        numeroAttach: dto.numeroAttach,
        conditionPaiement: dto.conditionPaiement,
        societe: dto.societe,
        chantier: dto.chantier,
        montant: totaux.totalTtc,
        totalHt: totaux.totalHt,
        totalTva: totaux.totalTva,
        totalTtc: totaux.totalTtc,
        montantEnLettres: totaux.montantEnLettres,
        ...(dto.lignes
          ? {
              lignes: {
                create: totaux.lignes.map((l, i) => ({
                  designation: l.designation,
                  quantite: l.quantite,
                  prixUnitaire: l.prixUnitaire,
                  montantHt: l.montantHt,
                  ordre: i,
                })),
              },
            }
          : {}),
      },
      include: this.venteInclude,
    });

    const pdfPath = await this.generateFactureVentePdfFile(facture);
    return this.prisma.factureVente.update({
      where: { id },
      data: { pdfPath },
      include: this.venteInclude,
    });
  }

  async removeVente(id: number) {
    const facture = await this.prisma.factureVente.findUnique({ where: { id } });
    if (!facture) throw new NotFoundException('Facture vente non trouvée');
    return this.prisma.factureVente.delete({ where: { id } });
  }

  getPdfAbsolutePath(relativePath: string): string {
    return path.join(process.cwd(), relativePath);
  }

  async regenerateVentePdf(id: number): Promise<string> {
    const facture = await this.findOneVente(id);
    return this.generateFactureVentePdfFile(facture);
  }

  private toPdfData(facture: any) {
    return {
      numeroFacture: facture.numeroFacture,
      dateFacture: facture.dateFacture,
      telephone: facture.telephone,
      mail: facture.mail,
      clientNom: facture.clientNom,
      clientAdresse: facture.clientAdresse,
      clientIce: facture.clientIce,
      codeClient: facture.codeClient,
      bonCommande: facture.bonCommande,
      numeroAttach: facture.numeroAttach,
      conditionPaiement: facture.conditionPaiement,
      lignes: facture.lignes.map((l: any) => ({
        designation: l.designation,
        quantite: Number(l.quantite),
        prixUnitaire: Number(l.prixUnitaire),
        montantHt: Number(l.montantHt),
      })),
      totalHt: Number(facture.totalHt),
      totalTva: Number(facture.totalTva),
      totalTtc: Number(facture.totalTtc),
      montantEnLettres: facture.montantEnLettres,
      societe: facture.societe,
      chantier: facture.chantier,
    };
  }

  private async generateFactureVentePdfFile(facture: any): Promise<string> {
    const dir = path.join(process.cwd(), 'storage', 'pdfs', 'factures', 'vente');
    fs.mkdirSync(dir, { recursive: true });
    const societeName = (facture.societe || 'oxyral').toLowerCase();
    const filename = `facture-${societeName}-${facture.numeroFacture.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
    const fullPath = path.join(dir, filename);
    await generateFactureVentePdf(this.toPdfData(facture), fullPath);
    return path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
  }

  private async generateFactureAchatPdf(facture: any) {
    const filename = `facture-achat-${facture.numeroFacture.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
    const fullPath = await this.pdfService.generatePdf(`factures/achat`, filename, (doc) => {
      doc.fontSize(20).text('Facture d\'Achat', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`N° Facture : ${facture.numeroFacture}`);
      doc.text(`Fournisseur : ${facture.fournisseur.nomFournisseur}`);
      doc.text(`Date : ${new Date(facture.dateFacture).toLocaleDateString('fr-FR')}`);
      doc.moveDown();
      doc.fontSize(14).text(`Montant : ${Number(facture.montant).toFixed(2)} MAD`, { underline: true });
    });
    return this.pdfService.getRelativePath(fullPath);
  }
}
