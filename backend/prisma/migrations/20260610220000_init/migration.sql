-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "employes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "cin" TEXT NOT NULL,
    "telephone" TEXT,
    "date_embauche" DATETIME NOT NULL,
    "societe" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "clients" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom_client" TEXT NOT NULL,
    "societe" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "fournisseurs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom_fournisseur" TEXT NOT NULL,
    "societe" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "conges" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employe_id" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "motif" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "conges_employe_id_fkey" FOREIGN KEY ("employe_id") REFERENCES "employes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bulletins_paie" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employe_id" INTEGER NOT NULL,
    "mois" INTEGER NOT NULL,
    "annee" INTEGER NOT NULL,
    "salaire_brut" DECIMAL NOT NULL,
    "primes" DECIMAL NOT NULL DEFAULT 0,
    "deductions" DECIMAL NOT NULL DEFAULT 0,
    "salaire_net" DECIMAL NOT NULL,
    "pdf_path" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bulletins_paie_employe_id_fkey" FOREIGN KEY ("employe_id") REFERENCES "employes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "factures_achat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fournisseur_id" INTEGER NOT NULL,
    "numero_facture" TEXT NOT NULL,
    "date_facture" DATETIME NOT NULL,
    "montant" DECIMAL NOT NULL,
    "pdf_path" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "factures_achat_fournisseur_id_fkey" FOREIGN KEY ("fournisseur_id") REFERENCES "fournisseurs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "factures_vente" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "client_id" INTEGER NOT NULL,
    "numero_facture" TEXT NOT NULL,
    "date_facture" DATETIME NOT NULL,
    "montant" DECIMAL NOT NULL,
    "pdf_path" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "factures_vente_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "encaissements" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "client_id" INTEGER NOT NULL,
    "montant" DECIMAL NOT NULL,
    "date" DATETIME NOT NULL,
    "reference" TEXT NOT NULL,
    "pdf_path" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "encaissements_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "decaissements" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fournisseur_id" INTEGER NOT NULL,
    "montant" DECIMAL NOT NULL,
    "date" DATETIME NOT NULL,
    "reference" TEXT NOT NULL,
    "pdf_path" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "decaissements_fournisseur_id_fkey" FOREIGN KEY ("fournisseur_id") REFERENCES "fournisseurs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employes_cin_key" ON "employes"("cin");

-- CreateIndex
CREATE UNIQUE INDEX "conges_employe_id_date_key" ON "conges"("employe_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "bulletins_paie_employe_id_mois_annee_key" ON "bulletins_paie"("employe_id", "mois", "annee");
