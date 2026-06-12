# Beta ERP - Oxyral & Chimiral

Application web de gestion interne (version Beta) pour les sociétés **Oxyral** (prestations de peinture industrielle) et **Chimiral** (fabrication et vente de peintures industrielles).

## Stack technique recommandée

### Frontend : **Next.js** (recommandé)

| Critère | Next.js | React (CRA/Vite) | Vue.js |
|---------|---------|------------------|--------|
| Routing | Intégré (App Router) | Externe (React Router) | Intégré (Vue Router) |
| Performance | SSR/SSG, optimisations auto | Client-side uniquement | SSR via Nuxt |
| Écosystème ERP | shadcn/ui, Tailwind, charts | Identique mais plus de config | Moins de libs ERP-ready |
| Évolutivité | Full-stack possible | Frontend seul | Nécessite Nuxt pour SSR |

**Choix : Next.js 14+** — Framework React moderne avec App Router, idéal pour un ERP : routing structuré par module, layouts partagés (sidebar), mode sombre natif, et base solide pour la version complète.

### Backend : **NestJS** (recommandé)

| Critère | NestJS | Express | Laravel |
|---------|--------|---------|---------|
| Architecture | Modulaire, DI, guards | Minimaliste, libre | Modulaire (PHP) |
| TypeScript | Natif | Optionnel | Non (PHP) |
| Sécurité | Guards, pipes, JWT intégrés | Manuel | Excellent |
| ERP / modules | Parfait (1 module = 1 domaine) | Refactoring nécessaire | Très bon mais stack différente |

**Choix : NestJS** — Architecture modulaire alignée sur les modules ERP (congés, paie, factures…), TypeScript partagé avec le frontend, validation et auth robustes dès la Beta.

### Base de données : **PostgreSQL** (recommandé)

| Critère | PostgreSQL | MySQL | MariaDB |
|---------|------------|-------|---------|
| Relations complexes | Excellent | Bon | Bon |
| Intégrité données | Contraintes strictes | Bon | Bon |
| JSON / flexibilité | JSONB natif | JSON limité | JSON limité |
| Évolutivité ERP | Standard entreprise | Courant | Fork MySQL |

**Choix : PostgreSQL** — Meilleur choix pour un ERP relationnel : intégrité forte, enums, contraintes, et extensibilité pour les modules futurs.

---

## Architecture

```
CHMIRAL/
├── backend/                 # API REST NestJS
│   ├── prisma/              # Schéma & migrations
│   ├── src/
│   │   ├── auth/            # Authentification JWT admin
│   │   ├── employes/        # Gestion employés
│   │   ├── clients/         # Gestion clients
│   │   ├── fournisseurs/    # Gestion fournisseurs
│   │   ├── conges/          # Module congés
│   │   ├── bulletins/       # Bulletins de paie + PDF
│   │   ├── factures/        # Factures achat/vente + PDF
│   │   ├── traites/         # Encaissements/décaissements + PDF
│   │   └── dashboard/       # Statistiques
│   └── storage/pdfs/        # PDFs générés
├── frontend/                # Interface Next.js
│   └── src/
│       ├── app/             # Pages par module
│       ├── components/      # UI (sidebar, dashboard…)
│       └── lib/             # API client, auth
└── README.md
```

## Prérequis

- Node.js 20+
- PostgreSQL 15+
- npm ou pnpm

## Installation

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```

> La version Beta utilise **SQLite** (`backend/prisma/dev.db`) pour un démarrage immédiat sans installation PostgreSQL. Pour la production, basculer vers PostgreSQL en modifiant `prisma/schema.prisma`.

API disponible sur `http://localhost:3001`

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Interface sur `http://localhost:3000`

### Compte administrateur (démo)

- **Email** : `admin@oxyral.ma`
- **Mot de passe** : `Admin123!`

## Modules

| Module | Fonctionnalités |
|--------|-----------------|
| Congés | Solde selon ancienneté (9j/18j), exclusion dimanches, déduction auto |
| Bulletins de paie | CRUD, historique, export PDF |
| Factures | Achat/vente, recherche, filtre période, export PDF |
| Traites & chèques | Encaissement/décaissement, recherche, export PDF |
| Dashboard | Stats employés, clients, fournisseurs, factures, congés |

## API

Documentation des endpoints principaux :

- `POST /api/auth/login` — Connexion admin
- `GET /api/dashboard/stats` — Statistiques dashboard
- `GET|POST /api/employes` — Employés
- `GET|POST /api/conges` — Congés (+ solde par employé)
- `GET|POST /api/bulletins` — Bulletins de paie
- `GET|POST /api/factures/achat|vente` — Factures
- `GET|POST /api/traites/encaissement|decaissement` — Traites

Toutes les routes (sauf login) nécessitent le header `Authorization: Bearer <token>`.
