# CESIZen

Application web de suivi de la santé mentale et des émotions, conçue avec la conformité RGPD comme principe fondamental.

## Stack technique

- **Frontend** : React  + TypeScript + Vite
- **Backend** : Node.js + Express + TypeScript
- **Base de données** : PostgreSQL 15 + Prisma ORM
- **Infrastructure** : Docker + Docker Compose + Nginx

## Fonctionnalités

- Tracker d'émotions avec hiérarchie (émotions primaires / sous-émotions)
- Journal de bord avec historique et statistiques mensuelles
- Pages d'information (prévention, exercices, informations)
- Panneau d'administration (gestion des utilisateurs, émotions, pages)
- Conformité RGPD : soft delete, pseudonymisation, droit à l'effacement

## Démarrage rapide

Voir [docs/INSTALL.md](docs/INSTALL.md) pour le guide complet.

```bash
# Lancer toute la stack avec Docker
docker compose up -d --build
```

### Développement local

```bash
# 1. Démarrer PostgreSQL
docker compose up -d postgres

# 2. Backend
cd apps/api
cp .env.example .env
npm install
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
npm run dev          # http://localhost:3000

# 3. Frontend (nouveau terminal)
cd apps/web
npm install
npm run dev          # http://localhost:5173
```

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Utilisateur | user@cesizen.fr | password |
| Administrateur | admin@cesizen.fr | password |

## Structure du projet

```
cesizen/
├── apps/
│   ├── api/          # Backend Node.js/Express
│   │   ├── prisma/   # Schéma & migrations
│   │   └── src/      # Routes, controllers, services, repositories
│   └── web/          # Frontend React
│       └── src/      # Pages, composants, hooks, types
├── docker-compose.yml
└── docs/
    └── INSTALL.md
```

## Sécurité & RGPD

- Authentification JWT (expiration 7 jours)
- Mots de passe hashés avec bcrypt (12 rounds)
- RBAC : rôles USER et ADMIN
- Soft delete sur les comptes (droit à l'effacement)
- Séparation USER / USER_INFO pour la pseudonymisation
