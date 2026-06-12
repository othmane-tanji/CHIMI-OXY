import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from '../common/pdf.service';
import { CreateFactureAchatDto, CreateFactureVenteDto } from './dto/create-facture.dto';
import { UpdateFactureDto } from './dto/update-facture.dto';

@Injectable()
export class FacturesService {
  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
  ) {}

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
    const pdfPath = await this.generateFacturePdf('achat', facture);
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
    const pdfPath = await this.generateFacturePdf('achat', facture);
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

  // --- Factures Vente ---
  findAllVente(filters?: { search?: string; dateDebut?: string; dateFin?: string }) {
    const where: any = {};
    if (filters?.search) {
      where.OR = [
        { numeroFacture: { contains: filters.search } },
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
      include: { client: true },
      orderBy: { dateFacture: 'desc' },
    });
  }

  async createVente(dto: CreateFactureVenteDto) {
    const facture = await this.prisma.factureVente.create({
      data: {
        clientId: dto.clientId,
        numeroFacture: dto.numeroFacture,
        dateFacture: new Date(dto.dateFacture),
        montant: dto.montant,
      },
      include: { client: true },
    });
    const pdfPath = await this.generateFacturePdf('vente', facture);
    return this.prisma.factureVente.update({
      where: { id: facture.id },
      data: { pdfPath },
      include: { client: true },
    });
  }

  async updateVente(id: number, dto: UpdateFactureDto) {
    const existing = await this.prisma.factureVente.findUnique({
      where: { id },
      include: { client: true },
    });
    if (!existing) throw new NotFoundException('Facture vente non trouvée');

    const facture = await this.prisma.factureVente.update({
      where: { id },
      data: {
        ...dto,
        dateFacture: dto.dateFacture ? new Date(dto.dateFacture) : undefined,
      },
      include: { client: true },
    });
    const pdfPath = await this.generateFacturePdf('vente', facture);
    return this.prisma.factureVente.update({
      where: { id },
      data: { pdfPath },
      include: { client: true },
    });
  }

  async removeVente(id: number) {
    const facture = await this.prisma.factureVente.findUnique({ where: { id } });
    if (!facture) throw new NotFoundException('Facture vente non trouvée');
    return this.prisma.factureVente.delete({ where: { id } });
  }

  private async generateFacturePdf(type: 'achat' | 'vente', facture: any) {
    const isAchat = type === 'achat';
    const titre = isAchat ? 'Facture d\'Achat' : 'Facture de Vente';
    const partenaire = isAchat
      ? facture.fournisseur.nomFournisseur
      : facture.client.nomClient;
    const filename = `facture-${type}-${facture.numeroFacture.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;

    const fullPath = await this.pdfService.generatePdf(`factures/${type}`, filename, (doc) => {
      doc.fontSize(20).text(titre, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`N° Facture : ${facture.numeroFacture}`);
      doc.text(`${isAchat ? 'Fournisseur' : 'Client'} : ${partenaire}`);
      doc.text(`Date : ${new Date(facture.dateFacture).toLocaleDateString('fr-FR')}`);
      doc.moveDown();
      doc.fontSize(14).text(`Montant : ${Number(facture.montant).toFixed(2)} MAD`, { underline: true });
    });

    return this.pdfService.getRelativePath(fullPath);
  }
}
