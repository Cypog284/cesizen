# ── Stage 1 : Build ──────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Installer TOUTES les dépendances (y compris devDependencies pour tsc + prisma CLI)
COPY package*.json ./
RUN npm ci

# Copier le code source et compiler
COPY . .
RUN npx prisma generate
RUN npm run build

# ── Stage 2 : Production ─────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Uniquement les dépendances de production
COPY package*.json ./
RUN npm ci --only=production

# Copier les artifacts du build et le schéma Prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma

EXPOSE 3000

# Lancer les migrations puis démarrer l'API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
