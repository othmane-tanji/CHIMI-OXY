-- Redefine payroll table to match the current application schema.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_bulletins_paie" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employe_id" INTEGER NOT NULL,
    "mois" INTEGER NOT NULL,
    "annee" INTEGER NOT NULL,
    "salaire_base" DECIMAL NOT NULL,
    "nombre_jours" INTEGER NOT NULL,
    "jours_absents" INTEGER NOT NULL DEFAULT 0,
    "taux_journalier" DECIMAL NOT NULL,
    "montant_appointements" DECIMAL NOT NULL,
    "taux_anciennete" DECIMAL NOT NULL DEFAULT 0,
    "montant_anciennete" DECIMAL NOT NULL DEFAULT 0,
    "salaire_brut" DECIMAL NOT NULL,
    "primes" DECIMAL NOT NULL DEFAULT 0,
    "cnss" DECIMAL NOT NULL DEFAULT 0,
    "amo" DECIMAL NOT NULL DEFAULT 0,
    "ir" DECIMAL NOT NULL DEFAULT 0,
    "indemnite_transport" DECIMAL NOT NULL DEFAULT 150,
    "deductions" DECIMAL NOT NULL DEFAULT 0,
    "salaire_net" DECIMAL NOT NULL,
    "pdf_path" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bulletins_paie_employe_id_fkey" FOREIGN KEY ("employe_id") REFERENCES "employes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_bulletins_paie" (
    "id", "employe_id", "mois", "annee", "salaire_base", "nombre_jours",
    "taux_journalier", "montant_appointements", "salaire_brut", "primes",
    "deductions", "salaire_net", "pdf_path", "created_at"
)
SELECT
    "id", "employe_id", "mois", "annee", "salaire_brut", 26,
    "salaire_brut" / 26, "salaire_brut", "salaire_brut", "primes",
    "deductions", "salaire_net", "pdf_path", "created_at"
FROM "bulletins_paie";

DROP TABLE "bulletins_paie";
ALTER TABLE "new_bulletins_paie" RENAME TO "bulletins_paie";
CREATE UNIQUE INDEX "bulletins_paie_employe_id_mois_annee_key" ON "bulletins_paie"("employe_id", "mois", "annee");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
