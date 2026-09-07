const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({
  datasources: {
    db: {
      url: 'file:../scratch/dev_aug19.db',
    },
  },
});

async function main() {
  try {
    const clients = await p.client.findMany();
    console.log('Clients count:', clients.length);
    console.log('Clients:', clients);
    const employes = await p.employe.findMany();
    console.log('Employes count:', employes.length);
    console.log('Employes:', employes.map(e => ({ id: e.id, nom: e.nom, prenom: e.prenom })));
  } catch (err) {
    console.error(err);
  } finally {
    await p.$disconnect();
  }
}

main();
