# NOME_DA_PLATAFORMA

SaaS de trading com IA/Bots que conecta à sua corretora (ex.: Binance) via API e executa estratégias automatizadas. Não custodial.

## Stack
- Frontend: Next.js + TypeScript + TailwindCSS
- Backend: Node.js (Express) + TypeScript
- DB: PostgreSQL (Prisma ORM)
- Filas/Workers: BullMQ + Redis
- Autenticação: JWT + 2FA (Speakeasy)
- Exchanges: Binance (testnet no MVP)

## Ambiente rápido (Docker)

Pré-requisitos: Docker + Docker Compose.

```bash
docker compose up --build -d
```

Serviços:
- API: http://localhost:4000/health
- Frontend: http://localhost:3000
- Postgres: localhost:5432
- Redis: localhost:6379

Rodar migrações:
```bash
docker compose exec backend npx prisma migrate deploy
```

## Dev local

Backend:
```bash
cd app/backend
cp .env.local .env
npm install
npx prisma generate
# Suba um Postgres local ou use docker compose para db/redis
npx prisma migrate dev --name init
npm run dev
```

Worker:
```bash
cd app/backend
npm run worker
```

Frontend:
```bash
cd app/frontend
cp .env.local .env.local
npm install
npm run dev
```

## Segurança
- Chaves de API criptografadas no banco (AES-256-GCM)
- JWT + 2FA opcional

## MVP Endpoints
- `POST /auth/register`, `POST /auth/login`
- `POST /auth/2fa/setup`, `POST /auth/2fa/verify`
- `GET /users/me`
- `GET /users/accounts`, `POST /users/accounts`, `POST /users/accounts/test`, `POST /users/accounts/:id/test`
- `GET /bots`, `POST /bots`, `POST /bots/:id/toggle`
- `GET /trading/balances/:accountId`
- `GET /portfolio/summary`, `GET /portfolio/trades`
- `GET /ia/suggestions`