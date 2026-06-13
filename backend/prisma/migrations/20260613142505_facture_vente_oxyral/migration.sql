-- AlterTable
ALTER TABLE "clients" ADD COLUMN "adresse" TEXT;
ALTER TABLE "clients" ADD COLUMN "ice" TEXT;
ALTER TABLE "clients" ADD COLUMN "ville" TEXT;

-- CreateTable
CREATE TABLE "facture_config" (
    "cle" TEXT NOT NULL PRIMARY KEY,
    "valeur" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "facture_vente_lignes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "facture_id" INTEGER NOT NULL,
    "designation" TEXT NOT NULL,
    "quantite" DECIMAL NOT NULL,
    "prix_unitaire" DECIMAL NOT NULL,
    "montant_ht" DECIMAL NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "facture_vente_lignes_facture_id_fkey" FOREIGN KEY ("facture_id") REFERENCES "factures_vente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_factures_vente" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "client_id" INTEGER,
    "numero_facture" TEXT NOT NULL,
    "date_facture" DATETIME NOT NULL,
    "montant" DECIMAL NOT NULL,
    "telephone" TEXT NOT NULL DEFAULT '0661 267 060',
    "mail" TEXT NOT NULL DEFAULT 'oxyral2010@gmail.com',
    "client_nom" TEXT NOT NULL DEFAULT '',
    "client_adresse" TEXT NOT NULL DEFAULT '',
    "client_ice" TEXT,
    "code_client" TEXT NOT NULL DEFAULT 'OX704',
    "bon_commande" TEXT,
    "numero_attach" TEXT,
    "rib" TEXT,
    "total_ht" DECIMAL NOT NULL DEFAULT 0,
    "total_tva" DECIMAL NOT NULL DEFAULT 0,
    "total_ttc" DECIMAL NOT NULL DEFAULT 0,
    "montant_en_lettres" TEXT,
    "pdf_path" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "factures_vente_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_factures_vente" ("client_id", "created_at", "date_facture", "id", "montant", "numero_facture", "pdf_path") SELECT "client_id", "created_at", "date_facture", "id", "montant", "numero_facture", "pdf_path" FROM "factures_vente";
DROP TABLE "factures_vente";
ALTER TABLE "new_factures_vente" RENAME TO "factures_vente";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
