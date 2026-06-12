import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EmployesModule } from './employes/employes.module';
import { ClientsModule } from './clients/clients.module';
import { FournisseursModule } from './fournisseurs/fournisseurs.module';
import { CongesModule } from './conges/conges.module';
import { BulletinsModule } from './bulletins/bulletins.module';
import { FacturesModule } from './factures/factures.module';
import { TraitesModule } from './traites/traites.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    EmployesModule,
    ClientsModule,
    FournisseursModule,
    CongesModule,
    BulletinsModule,
    FacturesModule,
    TraitesModule,
    DashboardModule,
  ],
})
export class AppModule {}
