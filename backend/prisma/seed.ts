import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Admin123!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@oxyral.ma' },
    update: {},
    create: {
      email: 'admin@oxyral.ma',
      password,
      nom: 'Administrateur ERP',
    },
  });

  const employes = await Promise.all([
    prisma.employe.upsert({
      where: { cin: 'AB123456' },
      update: {},
      create: {
        nom: 'Benali',
        prenom: 'Karim',
        cin: 'AB123456',
        telephone: '0612345678',
        dateEmbauche: new Date('2022-03-15'),
        societe: 'OXYRAL',
      },
    }),
    prisma.employe.upsert({
      where: { cin: 'CD789012' },
      update: {},
      create: {
        nom: 'Alaoui',
        prenom: 'Fatima',
        cin: 'CD789012',
        telephone: '0698765432',
        dateEmbauche: new Date('2024-08-01'),
        societe: 'CHIMIRAL',
      },
    }),
    prisma.employe.upsert({
      where: { cin: 'EF345678' },
      update: {},
      create: {
        nom: 'Tazi',
        prenom: 'Youssef',
        cin: 'EF345678',
        telephone: '0655443322',
        dateEmbauche: new Date('2020-01-10'),
        societe: 'OXYRAL',
      },
    }),
  ]);

  const clients = await Promise.all([
    prisma.client.create({
      data: { nomClient: 'Industries Métal Casablanca', societe: 'OXYRAL' },
    }),
    prisma.client.create({
      data: { nomClient: 'Auto Peinture Rabat', societe: 'CHIMIRAL' },
    }),
    prisma.client.create({
      data: { nomClient: 'Société Bois Fès', societe: 'OXYRAL' },
    }),
  ]);

  const fournisseurs = await Promise.all([
    prisma.fournisseur.create({
      data: { nomFournisseur: 'Pigments Maroc SA', societe: 'CHIMIRAL' },
    }),
    prisma.fournisseur.create({
      data: { nomFournisseur: 'Equipements Pro Oxyral', societe: 'OXYRAL' },
    }),
    prisma.fournisseur.create({
      data: { nomFournisseur: 'Resines Industrielles', societe: 'CHIMIRAL' },
    }),
  ]);

  await prisma.conge.createMany({
    data: [
      { employeId: employes[0].id, date: new Date('2025-07-01'), motif: 'Congé annuel' },
      { employeId: employes[0].id, date: new Date('2025-07-02'), motif: 'Congé annuel' },
      { employeId: employes[0].id, date: new Date('2025-07-03'), motif: 'Congé annuel' },
      { employeId: employes[2].id, date: new Date('2025-06-10'), motif: 'Congé personnel' },
      { employeId: employes[2].id, date: new Date('2025-06-11'), motif: 'Congé personnel' },
    ],
  });

  await prisma.bulletinPaie.create({
    data: {
      employeId: employes[0].id,
      mois: 5,
      annee: 2025,
      salaireBase: 3420,
      nombreJours: 26,
      joursAbsents: 0,
      tauxJournalier: 131.54,
      montantAppointements: 3420,
      tauxAnciennete: 5,
      montantAnciennete: 171,
      salaireBrut: 3591,
      primes: 0,
      cnss: 160.88,
      amo: 81.16,
      ir: 0,
      indemniteTransport: 150,
      deductions: 242.04,
      salaireNet: 3498.96,
    },
  });

  await prisma.factureAchat.create({
    data: {
      fournisseurId: fournisseurs[0].id,
      numeroFacture: 'FA-2025-001',
      dateFacture: new Date('2025-05-10'),
      montant: 45000,
    },
  });

  await prisma.factureAchat.create({
    data: {
      fournisseurId: fournisseurs[2].id,
      numeroFacture: 'FA-2025-002',
      dateFacture: new Date('2025-06-15'),
      montant: 28500,
    },
  });

  await prisma.factureVente.create({
    data: {
      clientId: clients[0].id,
      numeroFacture: 'FV-2025-001',
      dateFacture: new Date('2025-05-20'),
      montant: 75000,
    },
  });

  await prisma.factureVente.create({
    data: {
      clientId: clients[1].id,
      numeroFacture: 'FV-2025-002',
      dateFacture: new Date('2025-06-01'),
      montant: 32000,
    },
  });

  await prisma.encaissement.create({
    data: {
      clientId: clients[0].id,
      montant: 25000,
      date: new Date('2025-05-25'),
      reference: 'CHQ-2025-001',
    },
  });

  await prisma.decaissement.create({
    data: {
      fournisseurId: fournisseurs[0].id,
      montant: 15000,
      date: new Date('2025-05-12'),
      reference: 'TRT-2025-001',
    },
  });

  console.log('✅ Données de démonstration créées avec succès');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
