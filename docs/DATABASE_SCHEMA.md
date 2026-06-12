# Schéma de base de données - Beta ERP

## Diagramme ER

```mermaid
erDiagram
    USERS ||--o{ SESSION : has
    EMPLOYES ||--o{ CONGES : prend
    EMPLOYES ||--o{ BULLETINS_PAIE : recoit
    CLIENTS ||--o{ FACTURES_VENTE : recoit
    CLIENTS ||--o{ ENCAISSEMENTS : paie
    FOURNISSEURS ||--o{ FACTURES_ACHAT : emet
    FOURNISSEURS ||--o{ DECAISSEMENTS : recoit

    USERS {
        int id PK
        string email UK
        string password
        string nom
        datetime created_at
    }

    EMPLOYES {
        int id PK
        string nom
        string prenom
        string cin UK
        string telephone
        date date_embauche
        enum societe
    }

    CLIENTS {
        int id PK
        string nom_client
        enum societe
    }

    FOURNISSEURS {
        int id PK
        string nom_fournisseur
        enum societe
    }

    CONGES {
        int id PK
        int employe_id FK
        date date_debut
        date date_fin
        int jours_pris
        string motif
    }

    BULLETINS_PAIE {
        int id PK
        int employe_id FK
        int mois
        int annee
        decimal salaire_brut
        decimal primes
        decimal deductions
        decimal salaire_net
        string pdf_path
    }

    FACTURES_ACHAT {
        int id PK
        int fournisseur_id FK
        string numero_facture
        date date_facture
        decimal montant
        string pdf_path
    }

    FACTURES_VENTE {
        int id PK
        int client_id FK
        string numero_facture
        date date_facture
        decimal montant
        string pdf_path
    }

    ENCAISSEMENTS {
        int id PK
        int client_id FK
        decimal montant
        date date
        string reference
        string pdf_path
    }

    DECAISSEMENTS {
        int id PK
        int fournisseur_id FK
        decimal montant
        date date
        string reference
        string pdf_path
    }
```

## Enum Societe

- `OXYRAL` — Prestations de peinture industrielle
- `CHIMIRAL` — Fabrication et vente de peintures

## Règles métier - Congés

| Ancienneté | Droit annuel |
|------------|--------------|
| < 1 an | 9 jours |
| ≥ 1 an | 18 jours |

- Les **dimanches** ne sont pas comptabilisés
- `jours_pris` = jours ouvrés entre `date_debut` et `date_fin`
- `solde_restant` = `droit_annuel` - SUM(`jours_pris`)

## Stockage PDF

```
backend/storage/pdfs/
├── bulletins/
├── factures/
│   ├── achat/
│   └── vente/
└── traites/
    ├── encaissement/
    └── decaissement/
```
