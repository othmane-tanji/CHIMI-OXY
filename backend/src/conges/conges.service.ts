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

  private buildSolde(employe: { dateEmbauche: Date; conges: { date: Date }[] }) {
    const soldeInitial = getDroitAnnuel(employe.dateEmbauche);
    const joursConsommes = employe.conges.length;
    const soldeRestant = soldeInitial - joursConsommes;
    return { soldeInitial, joursConsommes, soldeRestant };
  }

  private countCongesMois(
    conges: { date: Date }[],
    mois: number,
    annee: number,
  ): number {
    return conges.filter((c) => {
      const d = normaliserDate(c.date);
      return d.getFullYear() === annee && d.getMonth() + 1 === mois;
    }).length;
  }

  async getSolde(employeId: number) {
    const employe = await this.getEmployeAvecConges(employeId);
    const { soldeInitial, joursConsommes, soldeRestant } = this.buildSolde(employe);

    return {
      employe: {
        id: employe.id,
        nom: employe.nom,
        prenom: employe.prenom,
        dateEmbauche: employe.dateEmbauche,
        societe: employe.societe,
      },
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
        const soldeInitial = getDroitAnnuel(employe.dateEmbauche);
        const joursConsommes = this.countCongesMois(employe.conges, mois, annee);
        const soldeRestant = soldeInitial - joursConsommes;
        return {
          employeId: employe.id,
          nom: employe.nom,
          prenom: employe.prenom,
          societe: employe.societe,
          soldeInitial,
          joursConsommes,
          soldeRestant,
        };
      }),
    };
  }

  async getResumeMensuel(employeId: number, annee: number) {
    const employe = await this.getEmployeAvecConges(employeId);
    const soldeInitial = getDroitAnnuel(employe.dateEmbauche);

    const moisNoms = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
    ];

    let cumulConsomme = 0;
    const mois = Array.from({ length: 12 }, (_, i) => {
      const moisNum = i + 1;
      const joursAbsents = employe.conges.filter((c) => {
        const d = normaliserDate(c.date);
        return d.getFullYear() === annee && d.getMonth() + 1 === moisNum;
      }).length;

      cumulConsomme += joursAbsents;

      return {
        mois: moisNum,
        moisLabel: moisNoms[i],
        joursAbsents,
        soldeRestant: soldeInitial - cumulConsomme,
      };
    });

    const totalAnnee = mois.reduce((sum, m) => sum + m.joursAbsents, 0);

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
      soldeRestant: soldeInitial - employe.conges.length,
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

    const datesInvalides = datesUniques.filter((d) => isDimanche(normaliserDate(d)));
    if (datesInvalides.length > 0) {
      throw new BadRequestException(
        `Les dimanches ne sont pas comptabilisés : ${datesInvalides.join(', ')}`,
      );
    }

    const datesExistantes = employe.conges.map((c) =>
      normaliserDate(c.date).toISOString().split('T')[0],
    );
    const doublons = datesUniques.filter((d) => datesExistantes.includes(d));
    if (doublons.length > 0) {
      throw new BadRequestException(
        `Ces jours sont déjà enregistrés : ${doublons.join(', ')}`,
      );
    }

    const { soldeRestant } = this.buildSolde(employe);
    if (datesUniques.length > soldeRestant) {
      throw new BadRequestException(
        `Solde insuffisant. Solde restant : ${soldeRestant} jour(s), demandé : ${datesUniques.length}`,
      );
    }

    await this.prisma.conge.createMany({
      data: datesUniques.map((date) => ({
        employeId: dto.employeId,
        date: normaliserDate(date),
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
}
