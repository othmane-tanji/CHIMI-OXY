import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCongeDto } from './dto/create-conge.dto';
import {
  debutMois,
  finMois,
  getDroitAnnuel,
  isDimanche,
  normaliserDate,
} from '../common/conges.utils';

function getValeurConge(typeJour?: string): number {
  if (typeJour === 'MATIN' || typeJour === 'APRES_MIDI') return 0.5;
  return 1.0;
}

@Injectable()
export class CongesService {
  constructor(private prisma: PrismaService) {}

  private async getEmployeAvecConges(employeId: number) {
    const employe = await this.prisma.employe.findUnique({
      where: { id: employeId },
      include: { conges: { orderBy: { date: 'asc' } } },
    });
    if (!employe) throw new NotFoundException('Employé non trouvé');
    return employe;
  }

  private buildSolde(
    employe: { dateEmbauche: Date; conges: { date: Date; typeJour?: string }[] },
    annee: number = new Date().getFullYear(),
  ) {
    const dEmbauche = normaliserDate(employe.dateEmbauche);
    const startYear = dEmbauche.getFullYear();

    let reliquatCumule = 0;
    let soldeInitialTarget = 0;
    let joursConsommesTarget = 0;
    let droitTarget = 0;

    for (let y = startYear; y <= annee; y++) {
      const refDateYear = new Date(y, 11, 31);
      const droitAnnee = getDroitAnnuel(dEmbauche, refDateYear);

      const congesYear = employe.conges.filter((c) => {
        const d = normaliserDate(c.date);
        return d.getFullYear() === y;
      });

      const prisYear = congesYear.reduce(
        (sum, c) => sum + getValeurConge(c.typeJour),
        0,
      );

      const soldeDisponibleYear = droitAnnee + reliquatCumule;
      const soldeRestantYear = soldeDisponibleYear - prisYear;

      if (y === annee) {
        droitTarget = droitAnnee;
        soldeInitialTarget = soldeDisponibleYear;
        joursConsommesTarget = prisYear;
      }

      reliquatCumule = Math.max(0, soldeRestantYear);
    }

    const soldeRestant = soldeInitialTarget - joursConsommesTarget;

    return {
      soldeInitial: soldeInitialTarget,
      droitAnnuelPure: droitTarget,
      joursConsommes: joursConsommesTarget,
      soldeRestant,
      reliquatReporte: soldeInitialTarget - droitTarget,
    };
  }

  private countCongesMois(
    conges: { date: Date; typeJour?: string }[],
    mois: number,
    annee: number,
  ): number {
    return conges
      .filter((c) => {
        const d = normaliserDate(c.date);
        return d.getFullYear() === annee && d.getMonth() + 1 === mois;
      })
      .reduce((sum, c) => sum + getValeurConge(c.typeJour), 0);
  }

  async getSolde(employeId: number, annee?: number) {
    const targetAnnee = annee || new Date().getFullYear();
    const employe = await this.getEmployeAvecConges(employeId);
    const { soldeInitial, joursConsommes, soldeRestant } = this.buildSolde(employe, targetAnnee);

    return {
      employe: {
        id: employe.id,
        nom: employe.nom,
        prenom: employe.prenom,
        dateEmbauche: employe.dateEmbauche,
        societe: employe.societe,
      },
      annee: targetAnnee,
      soldeInitial,
      joursConsommes,
      soldeRestant,
    };
  }

  async getSoldes(mois: number, annee: number) {
    const employes = await this.prisma.employe.findMany({
      include: { conges: true },
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
    });

    return {
      mois,
      annee,
      employes: employes.map((employe) => {
        const { soldeInitial, joursConsommes, soldeRestant } = this.buildSolde(employe, annee);
        const joursPrisMois = this.countCongesMois(employe.conges, mois, annee);
        return {
          employeId: employe.id,
          nom: employe.nom,
          prenom: employe.prenom,
          societe: employe.societe,
          soldeInitial,
          joursConsommes,
          joursPrisMois,
          soldeRestant,
        };
      }),
    };
  }

  async getResumeMensuel(employeId: number, annee: number) {
    const employe = await this.getEmployeAvecConges(employeId);
    const { soldeInitial } = this.buildSolde(employe, annee);

    const moisNoms = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ];

    let cumulConsomme = 0;
    const mois = Array.from({ length: 12 }, (_, i) => {
      const moisNum = i + 1;
      const joursAbsents = employe.conges
        .filter((c) => {
          const d = normaliserDate(c.date);
          return d.getFullYear() === annee && d.getMonth() + 1 === moisNum;
        })
        .reduce((sum, c) => sum + getValeurConge(c.typeJour), 0);

      cumulConsomme += joursAbsents;

      return {
        mois: moisNum,
        moisLabel: moisNoms[i],
        joursAbsents,
        soldeRestant: soldeInitial - cumulConsomme,
      };
    });

    const totalAnnee = mois.reduce((sum, m) => sum + m.joursAbsents, 0);

    const totalConsommeEmploye = employe.conges.reduce(
      (sum, c) => sum + getValeurConge(c.typeJour),
      0,
    );

    return {
      employe: {
        id: employe.id,
        nom: employe.nom,
        prenom: employe.prenom,
        societe: employe.societe,
      },
      annee,
      soldeInitial,
      totalAbsencesAnnee: totalAnnee,
      soldeRestant: soldeInitial - totalConsommeEmploye,
      mois,
    };
  }

  findAll(filters?: { employeId?: number; mois?: number; annee?: number }) {
    const where: any = {};

    if (filters?.employeId) where.employeId = filters.employeId;

    if (filters?.mois && filters?.annee) {
      where.date = {
        gte: debutMois(filters.mois, filters.annee),
        lte: finMois(filters.mois, filters.annee),
      };
    } else if (filters?.annee) {
      where.date = {
        gte: new Date(filters.annee, 0, 1),
        lte: new Date(filters.annee, 11, 31, 23, 59, 59, 999),
      };
    }

    return this.prisma.conge.findMany({
      where,
      include: {
        employe: { select: { id: true, nom: true, prenom: true, societe: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async create(dto: CreateCongeDto) {
    const employe = await this.getEmployeAvecConges(dto.employeId);
    const datesUniques = [...new Set(dto.dates.map((d) => d.split('T')[0]))].sort();
    const typeJour = dto.typeJour || 'JOURNEE';
    const valeurParJour = getValeurConge(typeJour);

    const datesInvalides = datesUniques.filter((d) => isDimanche(normaliserDate(d)));
    if (datesInvalides.length > 0) {
      throw new BadRequestException(
        `Les dimanches ne sont pas comptabilisés : ${datesInvalides.join(', ')}`,
      );
    }

    const congesExistants = employe.conges.map((c) => ({
      dateStr: normaliserDate(c.date).toISOString().split('T')[0],
      typeJour: c.typeJour || 'JOURNEE',
    }));

    const doublons = datesUniques.filter((d) =>
      congesExistants.some(
        (c) =>
          c.dateStr === d &&
          (c.typeJour === 'JOURNEE' || typeJour === 'JOURNEE' || c.typeJour === typeJour),
      ),
    );
    if (doublons.length > 0) {
      throw new BadRequestException(
        `Ces jours ou demi-journées sont déjà enregistrés : ${doublons.join(', ')}`,
      );
    }

    // Allow recording absences for all employees even if solde is 0, negative, or < 6 months seniority

    await this.prisma.conge.createMany({
      data: datesUniques.map((date) => ({
        employeId: dto.employeId,
        date: normaliserDate(date),
        typeJour,
        motif: dto.motif,
      })),
    });

    return this.findAll({ employeId: dto.employeId });
  }

  async remove(id: number) {
    const conge = await this.prisma.conge.findUnique({ where: { id } });
    if (!conge) throw new NotFoundException('Jour de congé non trouvé');
    return this.prisma.conge.delete({ where: { id } });
  }

  async exportExcel(employeId: number, annee?: number, mois?: number) {
    const isAllYears = annee === 0 || annee === -1;
    const targetAnnee = isAllYears ? new Date().getFullYear() : (annee || new Date().getFullYear());
    const employe = await this.getEmployeAvecConges(employeId);

    let soldeInitial: number;
    let joursConsommes: number;
    let soldeRestant: number;

    if (isAllYears) {
      soldeInitial = getDroitAnnuel(employe.dateEmbauche);
      joursConsommes = employe.conges.reduce(
        (sum, c) => sum + getValeurConge(c.typeJour),
        0,
      );
      soldeRestant = soldeInitial - joursConsommes;
    } else {
      const res = this.buildSolde(employe, targetAnnee);
      soldeInitial = res.soldeInitial;
      joursConsommes = res.joursConsommes;
      soldeRestant = res.soldeRestant;
    }

    const congesEmploye = isAllYears
      ? employe.conges
      : employe.conges.filter((c) => {
          const d = normaliserDate(c.date);
          const sameYear = d.getFullYear() === targetAnnee;
          if (!sameYear) return false;
          if (mois) {
            return d.getMonth() + 1 === mois;
          }
          return true;
        });

    const { generateCongeExcel } = await import('./conges-excel.generator');

    const buffer = await generateCongeExcel({
      employe: {
        id: employe.id,
        nom: employe.nom,
        prenom: employe.prenom,
        societe: employe.societe,
        dateEmbauche: employe.dateEmbauche,
        cin: employe.cin || undefined,
      },
      soldeInitial,
      joursConsommes,
      soldeRestant,
      annee: isAllYears ? 0 : targetAnnee,
      mois: isAllYears ? undefined : (mois || undefined),
      isAllYears,
      conges: congesEmploye,
    });

    const nomClean = `${employe.prenom}-${employe.nom}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const moisNoms = [
      'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre',
    ];
    const moisSuffix = !isAllYears && mois && mois >= 1 && mois <= 12 ? `-${moisNoms[mois - 1]}` : '';
    const anneeSuffix = isAllYears ? '-toutes-les-annees' : `-${targetAnnee}`;

    return {
      filename: `releve-conges-${nomClean}${moisSuffix}${anneeSuffix}.xlsx`,
      buffer,
    };
  }

  async exportExcelGlobal(annee?: number) {
    const targetAnnee = annee || new Date().getFullYear();
    const employes = await this.prisma.employe.findMany({
      include: { conges: true },
      orderBy: [{ societe: 'asc' }, { nom: 'asc' }, { prenom: 'asc' }],
    });

    const employesData = employes.map((employe) => {
      const { soldeInitial, joursConsommes, soldeRestant } = this.buildSolde(employe, targetAnnee);
      const congesEmploye = employe.conges.filter((c) => {
        const d = normaliserDate(c.date);
        return d.getFullYear() === targetAnnee;
      });

      return {
        employe: {
          id: employe.id,
          nom: employe.nom,
          prenom: employe.prenom,
          societe: employe.societe,
          dateEmbauche: employe.dateEmbauche,
          cin: employe.cin || undefined,
        },
        soldeInitial,
        joursConsommes,
        soldeRestant,
        conges: congesEmploye,
      };
    });

    const { generateCongesGlobalExcel } = await import('./conges-excel.generator');

    const buffer = await generateCongesGlobalExcel({
      annee: targetAnnee,
      employes: employesData,
    });

    return {
      filename: `releve-conges-tous-les-employes-${targetAnnee}.xlsx`,
      buffer,
    };
  }
}
