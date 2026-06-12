ALTER TABLE "employes" ADD COLUMN "adresse" TEXT;
ALTER TABLE "employes" ADD COLUMN "date_naissance" DATETIME;
ALTER TABLE "employes" ADD COLUMN "fonction" TEXT DEFAULT 'EMPLOYE';
ALTER TABLE "employes" ADD COLUMN "situation_familiale" TEXT;
ALTER TABLE "employes" ADD COLUMN "nombre_enfants" INTEGER DEFAULT 0;
ALTER TABLE "employes" ADD COLUMN "cnss" TEXT;
ALTER TABLE "employes" ADD COLUMN "cimr" TEXT;
