# 📖 Guide d'installation — CESIZen

> Application web de suivi de la santé mentale  
> Stack : React + TypeScript + Vite · Node.js + Express + TypeScript · PostgreSQL + Prisma

---

## Prérequis

| Outil | Version minimum | Vérification |
|-------|----------------|--------------|
| Node.js | 20.x | `node -v` |
| npm | 9.x | `npm -v` |
| Docker | 24.x | `docker -v` |
| Docker Compose | 2.x | `docker compose version` |
| Git | 2.x | `git -v` |

---

## 🚀 Installation rapide (développement)

### 1. Cloner le projet

```bash
git clone https://github.com/votre-repo/cesizen.git
cd cesizen
```

### 2. Lancer PostgreSQL avec Docker

```bash
# Démarrer uniquement la base de données
docker compose up -d postgres
```

Vérifiez que le conteneur est actif :
```bash
docker ps
# cesizen_db doit être "Up"
```

---

### 3. Configurer et lancer le Backend (API)

```bash
cd apps/api

# Installer les dépendances
npm install

# Créer le fichier .env (déjà configuré pour le dev local)
cp .env.example .env
```

Le fichier `.env` doit contenir :
```env
DATABASE_URL="postgresql://cesizen:cesizen_secret@localhost:5432/cesizen_db"
JWT_SECRET="cesizen_jwt_super_secret_2025"
PORT=3000
NODE_ENV=development
```

```bash
# Générer le client Prisma
npx prisma generate

# Appliquer les migrations (crée les tables)
npx prisma migrate dev --name init

# Peupler la base avec les données de démonstration
npx ts-node prisma/seed.ts

# Lancer le serveur en mode développement
npm run dev
```

✅ L'API est accessible sur : **http://localhost:3000**  
✅ Vérification : http://localhost:3000/api/health

---

### 4. Configurer et lancer le Frontend (Web)

Ouvrir un **nouveau terminal** :

```bash
cd apps/web

# Installer les dépendances
npm install

# Lancer Vite en mode développement
npm run dev
```

✅ L'application est accessible sur : **http://localhost:5173**

---

## 🔑 Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Utilisateur | user@cesizen.fr | password |
| Administrateur | admin@cesizen.fr | password |

---

## 🐳 Déploiement complet avec Docker (production)

Pour lancer l'intégralité de la stack (PostgreSQL + API + Web) en un seul commande :

```bash
# À la racine du projet
docker compose up -d --build
```

Les services démarrent dans cet ordre :
1. `cesizen_db` — PostgreSQL sur le port 5432
2. `cesizen_api` — API Node.js sur le port 3000 (+ migrations auto)
3. `cesizen_web` — Frontend Nginx sur le port 80

✅ Application accessible sur : **http://localhost**

### Arrêter les services
```bash
docker compose down
```

### Voir les logs
```bash
docker compose logs -f api
docker compose logs -f web
```

### Réinitialiser la base de données
```bash
docker compose down -v   # supprime les volumes
docker compose up -d --build
```

---

## 🗄️ Gestion de la base de données

### Voir les données (interface graphique)
```bash
cd apps/api
npx prisma studio
# Ouvre http://localhost:5555
```

### Créer une nouvelle migration
```bash
cd apps/api
npx prisma migrate dev --name nom_de_la_migration
```

### Réinitialiser complètement
```bash
cd apps/api
npm run db:reset
# = migrate reset + seed automatique
```

---

## 📡 Endpoints API principaux

### Authentification
| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| POST | `/api/auth/register` | Créer un compte | Public |
| POST | `/api/auth/login` | Se connecter | Public |
| GET | `/api/auth/me` | Profil courant | 🔒 User |
| PUT | `/api/auth/me` | Modifier le profil | 🔒 User |
| DELETE | `/api/auth/me` | Supprimer son compte (RGPD) | 🔒 User |

### Tracker d'émotions
| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | `/api/tracker` | Historique des entrées | 🔒 User |
| POST | `/api/tracker` | Ajouter une entrée | 🔒 User |
| DELETE | `/api/tracker/:id` | Supprimer une entrée | 🔒 User |
| GET | `/api/tracker/report` | Rapport / statistiques | 🔒 User |

### Pages d'information
| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | `/api/pages` | Pages publiées | Public |
| GET | `/api/pages/all` | Toutes les pages | 🔒 Admin |
| POST | `/api/pages` | Créer une page | 🔒 Admin |
| PUT | `/api/pages/:id` | Modifier une page | 🔒 Admin |
| DELETE | `/api/pages/:id` | Supprimer une page | 🔒 Admin |

### Émotions
| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | `/api/emotions` | Émotions hiérarchiques (niv. 1 + 2) | Public |
| GET | `/api/emotions/flat` | Toutes les émotions à plat | Public |
| POST | `/api/emotions` | Ajouter une émotion | 🔒 Admin |
| PUT | `/api/emotions/:id` | Modifier une émotion | 🔒 Admin |
| DELETE | `/api/emotions/:id` | Supprimer une émotion | 🔒 Admin |

### Utilisateurs (Admin)
| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | `/api/users` | Liste des utilisateurs | 🔒 Admin |
| GET | `/api/users/dashboard` | Statistiques globales | 🔒 Admin |
| PUT | `/api/users/:id/role` | Modifier le rôle | 🔒 Admin |
| DELETE | `/api/users/:id` | Supprimer (soft delete RGPD) | 🔒 Admin |

---

## 🏗️ Architecture du projet

```
cesizen/
├── docker-compose.yml
├── apps/
│   ├── api/                        # Backend Node.js
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Modèle de données PostgreSQL
│   │   │   └── seed.ts             # Données initiales
│   │   └── src/
│   │       ├── routes/             # Couche 1 : Routage Express
│   │       ├── controllers/        # Couche 2 : Logique HTTP
│   │       ├── services/           # Couche 3 : Logique métier
│   │       ├── repositories/       # Couche 4 : Accès données (Prisma)
│   │       └── middleware/         # JWT Auth, requireAdmin
│   └── web/                        # Frontend React
│       └── src/
│           ├── api/                # Client axios + services
│           ├── hooks/              # useAuth (Context)
│           ├── pages/              # Pages React (router)
│           ├── components/         # Composants réutilisables
│           └── types/              # Types TypeScript partagés
└── docs/
    ├── INSTALL.md                  # Ce fichier
    ├── architecture.md             # Choix techniques
    └── recette.md                  # Cahier de tests
```

---

## 🔒 Sécurité & RGPD

- **Authentification** : JWT (JSON Web Token), expiration 7 jours
- **Mots de passe** : Hashés avec bcrypt (12 rounds)
- **Communications** : HTTPS en production (SSL/TLS)
- **Données** : Hébergement exclusivement en Union Européenne
- **Droit à l'effacement** : Soft delete sur les comptes utilisateurs
- **Pseudonymisation** : Séparation USER / USER_INFO en base de données

---

## 🐛 Résolution des problèmes courants

### Erreur de connexion à PostgreSQL
```bash
# Vérifier que le conteneur Docker est bien lancé
docker ps | grep cesizen_db

# Relancer si nécessaire
docker compose restart postgres
```

### Erreur "Prisma Client not generated"
```bash
cd apps/api
npx prisma generate
```

### Port 3000 déjà utilisé
```bash
# Modifier PORT dans apps/api/.env
PORT=3001
```

### Les migrations échouent
```bash
cd apps/api
npx prisma migrate reset --force
npx ts-node prisma/seed.ts
```
