import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { isCongeEnCours, normaliserDate } from '../common/conges.utils';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
    const finMois = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [
      nbEmployes,
      nbClients,
      nbFournisseurs,
      facturesAchatMois,
      facturesVenteMois,
      conges,
    ] = await Promise.all([
      this.prisma.employe.count(),
      this.prisma.client.count(),
      this.prisma.fournisseur.count(),
      this.prisma.factureAchat.count({
        where: { dateFacture: { gte: debutMois, lte: finMois } },
      }),
      this.prisma.factureVente.count({
        where: { dateFacture: { gte: debutMois, lte: finMois } },
      }),
      this.prisma.conge.findMany({
        include: {
          employe: { select: { nom: true, prenom: true, societe: true } },
        },
      }),
    ]);

    const congesEnCours = conges.filter((c) => isCongeEnCours(c.date));

    // Calculate last 6 months ranges
    const statsMois: any[] = [];
    const moisNoms = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const nom = `${moisNoms[month]} ${String(year).substring(2)}`;
      
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59);
      
      statsMois.push({
        nom,
        start,
        end,
        ventesOxyral: 0,
        ventesChimiral: 0,
        achats: 0,
        conges: 0,
      });
    }

    // Query all sales in the last 6 months
    const debutSixMois = statsMois[0].start;
    const [ventes, achats, congesSemestre, employesSociete] = await Promise.all([
      this.prisma.factureVente.findMany({
        where: { dateFacture: { gte: debutSixMois } },
        select: { dateFacture: true, totalTtc: true, societe: true },
      }),
      this.prisma.factureAchat.findMany({
        where: { dateFacture: { gte: debutSixMois } },
        select: { dateFacture: true, montant: true },
      }),
      this.prisma.conge.findMany({
        where: { date: { gte: debutSixMois } },
        select: { date: true },
      }),
      this.prisma.employe.groupBy({
        by: ['societe'],
        _count: { id: true },
      }),
    ]);

    // Group the data by month
    for (const v of ventes) {
      const vDate = new Date(v.dateFacture);
      for (const m of statsMois) {
        if (vDate >= m.start && vDate <= m.end) {
          if (v.societe === 'CHIMIRAL') {
            m.ventesChimiral += Number(v.totalTtc);
          } else {
            m.ventesOxyral += Number(v.totalTtc);
          }
          break;
        }
      }
    }

    for (const a of achats) {
      const aDate = new Date(a.dateFacture);
      for (const m of statsMois) {
        if (aDate >= m.start && aDate <= m.end) {
          m.achats += Number(a.montant);
          break;
        }
      }
    }

    for (const c of congesSemestre) {
      const cDate = new Date(c.date);
      for (const m of statsMois) {
        if (cDate >= m.start && cDate <= m.end) {
          m.conges += 1;
          break;
        }
      }
    }

    // Count employees by company
    let nbEmployesOxyral = 0;
    let nbEmployesChimiral = 0;
    for (const group of employesSociete) {
      if (group.societe === 'CHIMIRAL') {
        nbEmployesChimiral = group._count.id;
      } else {
        nbEmployesOxyral = group._count.id;
      }
    }

    return {
      nbEmployes,
      nbEmployesOxyral,
      nbEmployesChimiral,
      nbClients,
      nbFournisseurs,
      facturesMois: facturesAchatMois + facturesVenteMois,
      facturesAchatMois,
      facturesVenteMois,
      congesEnCours: congesEnCours.length,
      congesEnCoursListe: congesEnCours.map((c) => ({
        id: c.id,
        employe: `${c.employe.prenom} ${c.employe.nom}`,
        societe: c.employe.societe,
        date: c.date,
      })),
      historiqueMois: statsMois.map((m) => ({
        nom: m.nom,
        ventesOxyral: m.ventesOxyral,
        ventesChimiral: m.ventesChimiral,
        achats: m.achats,
        conges: m.conges,
      })),
    };
  }
}
