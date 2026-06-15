import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { generateBulletinPaiePdf, BulletinCumuls } from '../common/bulletin-pdf.generator';
import {
  calculerBulletin,
  JOURS_APPOINTEMENT_BASE,
} from '../common/paie.utils';
import { debutMois, finMois } from '../common/conges.utils';
import { CreateBulletinDto } from './dto/create-bulletin.dto';
import { UpdateBulletinDto } from './dto/update-bulletin.dto';

@Injectable()
export class BulletinsService {
  constructor(private prisma: PrismaService) {}

  private async countAbsencesMois(
    employeId: number,
    mois: number,
    annee: number,
  ): Promise<number> {
    return this.prisma.conge.count({
      where: {
        employeId,
        date: {
          gte: debutMois(mois, annee),
          lte: finMois(mois, annee),
        },
      },
    });
  }

  async getCalculPreview(
    employeId: number,
    mois: number,
    annee: number,
    salaireBase: number,
    nombreJours?: number,
    primes?: number,
    indemniteTransport?: number,
    ir?: number,
  ) {
    const employe = await this.prisma.employe.findUnique({
      where: { id: employeId },
    });
    if (!employe) throw new NotFoundException('Employé non trouvé');

    const joursAbsents = await this.countAbsencesMois(employeId, mois, annee);
    const joursAttendus = JOURS_APPOINTEMENT_BASE;
    const jours = nombreJours ?? joursAttendus;

    const calcul = calculerBulletin({
      salaireBase,
      nombreJours: jours,
      joursAbsents,
      dateEmbauche: employe.dateEmbauche,
      mois,
      annee,
      primes,
      indemniteTransport,
      ir,
    });

    return {
      employe: {
        id: employe.id,
        nom: employe.nom,
        prenom: employe.prenom,
        societe: employe.societe,
        dateEmbauche: employe.dateEmbauche,
      },
      mois,
      annee,
      joursAppointementBase: JOURS_APPOINTEMENT_BASE,
      joursAbsents,
      nombreJours: jours,
      ...calcul,
    };
  }

  findAll(employeId?: number) {
    return this.prisma.bulletinPaie.findMany({
      where: employeId ? { employeId } : undefined,
      include: {
        employe: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            societe: true,
            cin: true,
            dateEmbauche: true,
          },
        },
      },
      orderBy: [{ annee: 'desc' }, { mois: 'desc' }],
    });
  }

  async findOne(id: number) {
    const bulletin = await this.prisma.bulletinPaie.findUnique({
      where: { id },
      include: { employe: true },
    });
    if (!bulletin) throw new NotFoundException('Bulletin non trouvé');
    return bulletin;
  }

  private async buildAndValidate(
    employeId: number,
    mois: number,
    annee: number,
    salaireBase: number,
    nombreJours: number,
    options: {
      primes?: number;
      indemniteTransport?: number;
      ir?: number;
      confirmerAvertissement?: boolean;
    },
  ) {
    const preview = await this.getCalculPreview(
      employeId,
      mois,
      annee,
      salaireBase,
      nombreJours,
      options.primes,
      options.indemniteTransport,
      options.ir,
    );

    if (preview.avertissement && !options.confirmerAvertissement) {
      throw new BadRequestException({
        message: preview.avertissement,
        avertissement: preview.avertissement,
        joursAttendus: preview.joursAttendus,
        joursAbsents: preview.joursAbsents,
      });
    }

    return preview;
  }

  async create(dto: CreateBulletinDto) {
    const preview = await this.buildAndValidate(
      dto.employeId,
      dto.mois,
      dto.annee,
      dto.salaireBase,
      dto.nombreJours,
      dto,
    );

    const bulletin = await this.prisma.bulletinPaie.create({
      data: {
        employeId: dto.employeId,
        mois: dto.mois,
        annee: dto.annee,
        salaireBase: dto.salaireBase,
        nombreJours: dto.nombreJours,
        joursAbsents: preview.joursAbsents,
        tauxJournalier: preview.tauxJournalier,
        montantAppointements: preview.montantAppointements,
        tauxAnciennete: preview.tauxAnciennete,
        montantAnciennete: preview.montantAnciennete,
        salaireBrut: preview.salaireBrut,
        primes: preview.primes,
        cnss: preview.cnss,
        amo: preview.amo,
        ir: preview.ir,
        indemniteTransport: preview.indemniteTransport,
        deductions: preview.totalRetenues,
        salaireNet: preview.salaireNet,
      },
      include: { employe: true },
    });

    try {
      const pdfPath = await this.generatePdfFile(bulletin);
      return this.prisma.bulletinPaie.update({
        where: { id: bulletin.id },
        data: { pdfPath },
        include: { employe: true },
      });
    } catch (err) {
      await this.prisma.bulletinPaie.delete({ where: { id: bulletin.id } });
      throw err;
    }
  }

  async update(id: number, dto: UpdateBulletinDto) {
    const existing = await this.findOne(id);
    const salaireBase = dto.salaireBase ?? Number(existing.salaireBase);
    const nombreJours = dto.nombreJours ?? existing.nombreJours;

    const preview = await this.buildAndValidate(
      existing.employeId,
      existing.mois,
      existing.annee,
      salaireBase,
      nombreJours,
      {
        primes: dto.primes ?? Number(existing.primes),
        indemniteTransport:
          dto.indemniteTransport ?? Number(existing.indemniteTransport),
        ir: dto.ir ?? Number(existing.ir),
        confirmerAvertissement: dto.confirmerAvertissement,
      },
    );

    const bulletin = await this.prisma.bulletinPaie.update({
      where: { id },
      data: {
        salaireBase,
        nombreJours,
        joursAbsents: preview.joursAbsents,
        tauxJournalier: preview.tauxJournalier,
        montantAppointements: preview.montantAppointements,
        tauxAnciennete: preview.tauxAnciennete,
        montantAnciennete: preview.montantAnciennete,
        salaireBrut: preview.salaireBrut,
        primes: preview.primes,
        cnss: preview.cnss,
        amo: preview.amo,
        ir: preview.ir,
        indemniteTransport: preview.indemniteTransport,
        deductions: preview.totalRetenues,
        salaireNet: preview.salaireNet,
      },
      include: { employe: true },
    });

    const pdfPath = await this.generatePdfFile(bulletin);
    return this.prisma.bulletinPaie.update({
      where: { id },
      data: { pdfPath },
      include: { employe: true },
    });
  }

  async remove(id: number) {
    const bulletin = await this.findOne(id);
    if (bulletin.pdfPath) {
      const full = path.join(process.cwd(), bulletin.pdfPath);
      if (fs.existsSync(full)) fs.unlinkSync(full);
    }
    return this.prisma.bulletinPaie.delete({ where: { id } });
  }

  async regeneratePdf(id: number): Promise<string> {
    const bulletin = await this.findOne(id);
    const pdfPath = await this.generatePdfFile(bulletin);
    await this.prisma.bulletinPaie.update({
      where: { id },
      data: { pdfPath },
    });
    return pdfPath;
  }

  getPdfAbsolutePath(bulletin: { pdfPath?: string | null }): string {
    if (!bulletin.pdfPath) throw new NotFoundException('PDF non disponible');
    const full = path.join(process.cwd(), bulletin.pdfPath);
    if (!fs.existsSync(full)) throw new NotFoundException('Fichier PDF introuvable');
    return full;
  }

  private async getCumuls(
    employeId: number,
    annee: number,
    mois: number,
    current: { salaireBrut: number; deductions: number; cnss: number; amo: number; ir: number; nombreJours: number },
  ): Promise<BulletinCumuls> {
    const precedents = await this.prisma.bulletinPaie.findMany({
      where: { employeId, annee, mois: { lt: mois } },
    });

    const cumulBrut = precedents.reduce((s, b) => s + Number(b.salaireBrut), 0) + current.salaireBrut;
    const cumulRetenues = precedents.reduce((s, b) => s + Number(b.deductions), 0) + current.deductions;
    const cumulDeductions =
      precedents.reduce((s, b) => s + Number(b.cnss) + Number(b.amo), 0) + current.cnss + current.amo;
    const cumulIr = precedents.reduce((s, b) => s + Number(b.ir), 0) + current.ir;
    const joursIr =
      precedents.reduce((s, b) => s + b.nombreJours, 0) + current.nombreJours;

    return {
      joursIr,
      cumulBaseImposable: cumulBrut,
      cumulRetenues,
      cumulDeductions,
      cumulRetenuesIr: cumulIr,
    };
  }

  private async generatePdfFile(bulletin: any): Promise<string> {
    const dir = path.join(process.cwd(), 'storage', 'pdfs', 'bulletins');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const cumuls = await this.getCumuls(bulletin.employeId, bulletin.annee, bulletin.mois, {
      salaireBrut: Number(bulletin.salaireBrut),
      deductions: Number(bulletin.deductions),
      cnss: Number(bulletin.cnss),
      amo: Number(bulletin.amo),
      ir: Number(bulletin.ir),
      nombreJours: bulletin.nombreJours,
    });

    const filename = `bulletin-${bulletin.employe.cin}-${bulletin.annee}-${String(bulletin.mois).padStart(2, '0')}.pdf`;
    const fullPath = path.join(dir, filename);
    await generateBulletinPaiePdf(bulletin, fullPath, cumuls);
    return path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
  }
}
