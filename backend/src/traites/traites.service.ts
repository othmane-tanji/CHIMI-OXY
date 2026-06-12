import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from '../common/pdf.service';
import {
  CreateDecaissementDto,
  CreateEncaissementDto,
} from './dto/create-traite.dto';
import { UpdateTraiteDto } from './dto/update-traite.dto';

@Injectable()
export class TraitesService {
  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
  ) {}

  findAllEncaissements(filters?: { dateDebut?: string; dateFin?: string; search?: string }) {
    const where: any = {};
    if (filters?.search) {
      where.OR = [
        { reference: { contains: filters.search } },
        { client: { nomClient: { contains: filters.search } } },
      ];
    }
    if (filters?.dateDebut || filters?.dateFin) {
      where.date = {};
      if (filters.dateDebut) where.date.gte = new Date(filters.dateDebut);
      if (filters.dateFin) where.date.lte = new Date(filters.dateFin);
    }
    return this.prisma.encaissement.findMany({
      where,
      include: { client: true },
      orderBy: { date: 'desc' },
    });
  }

  async createEncaissement(dto: CreateEncaissementDto) {
    const encaissement = await this.prisma.encaissement.create({
      data: {
        clientId: dto.clientId,
        montant: dto.montant,
        date: new Date(dto.date),
        reference: dto.reference,
      },
      include: { client: true },
    });
    const pdfPath = await this.generateTraitePdf('encaissement', encaissement);
    return this.prisma.encaissement.update({
      where: { id: encaissement.id },
      data: { pdfPath },
      include: { client: true },
    });
  }

  async updateEncaissement(id: number, dto: UpdateTraiteDto) {
    const existing = await this.prisma.encaissement.findUnique({
      where: { id },
      include: { client: true },
    });
    if (!existing) throw new NotFoundException('Encaissement non trouvé');

    const encaissement = await this.prisma.encaissement.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
      include: { client: true },
    });
    const pdfPath = await this.generateTraitePdf('encaissement', encaissement);
    return this.prisma.encaissement.update({
      where: { id },
      data: { pdfPath },
      include: { client: true },
    });
  }

  async removeEncaissement(id: number) {
    const item = await this.prisma.encaissement.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Encaissement non trouvé');
    return this.prisma.encaissement.delete({ where: { id } });
  }

  findAllDecaissements(filters?: { dateDebut?: string; dateFin?: string; search?: string }) {
    const where: any = {};
    if (filters?.search) {
      where.OR = [
        { reference: { contains: filters.search } },
        { fournisseur: { nomFournisseur: { contains: filters.search } } },
      ];
    }
    if (filters?.dateDebut || filters?.dateFin) {
      where.date = {};
      if (filters.dateDebut) where.date.gte = new Date(filters.dateDebut);
      if (filters.dateFin) where.date.lte = new Date(filters.dateFin);
    }
    return this.prisma.decaissement.findMany({
      where,
      include: { fournisseur: true },
      orderBy: { date: 'desc' },
    });
  }

  async createDecaissement(dto: CreateDecaissementDto) {
    const decaissement = await this.prisma.decaissement.create({
      data: {
        fournisseurId: dto.fournisseurId,
        montant: dto.montant,
        date: new Date(dto.date),
        reference: dto.reference,
      },
      include: { fournisseur: true },
    });
    const pdfPath = await this.generateTraitePdf('decaissement', decaissement);
    return this.prisma.decaissement.update({
      where: { id: decaissement.id },
      data: { pdfPath },
      include: { fournisseur: true },
    });
  }

  async updateDecaissement(id: number, dto: UpdateTraiteDto) {
    const existing = await this.prisma.decaissement.findUnique({
      where: { id },
      include: { fournisseur: true },
    });
    if (!existing) throw new NotFoundException('Décaissement non trouvé');

    const decaissement = await this.prisma.decaissement.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
      include: { fournisseur: true },
    });
    const pdfPath = await this.generateTraitePdf('decaissement', decaissement);
    return this.prisma.decaissement.update({
      where: { id },
      data: { pdfPath },
      include: { fournisseur: true },
    });
  }

  async removeDecaissement(id: number) {
    const item = await this.prisma.decaissement.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Décaissement non trouvé');
    return this.prisma.decaissement.delete({ where: { id } });
  }

  private async generateTraitePdf(type: 'encaissement' | 'decaissement', item: any) {
    const isEnc = type === 'encaissement';
    const titre = isEnc ? 'Encaissement' : 'Décaissement';
    const partenaire = isEnc ? item.client.nomClient : item.fournisseur.nomFournisseur;
    const filename = `${type}-${item.reference.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;

    const fullPath = await this.pdfService.generatePdf(`traites/${type}`, filename, (doc) => {
      doc.fontSize(20).text(`${titre} - Traite/Chèque`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Référence : ${item.reference}`);
      doc.text(`${isEnc ? 'Client' : 'Fournisseur'} : ${partenaire}`);
      doc.text(`Date : ${new Date(item.date).toLocaleDateString('fr-FR')}`);
      doc.moveDown();
      doc.fontSize(14).text(`Montant : ${Number(item.montant).toFixed(2)} MAD`, { underline: true });
    });

    return this.pdfService.getRelativePath(fullPath);
  }
}
