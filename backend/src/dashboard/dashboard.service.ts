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

    return {
      nbEmployes,
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
    };
  }
}
