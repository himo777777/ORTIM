# B-ORTIM - Blended Ortopedisk Traumatologi i Medicinsk Utbildning

En modern PWA-plattform för medicinsk utbildning med fokus på ortopedisk traumatologi.

## 🎯 Översikt

B-ORTIM är en komplett lärplattform byggd som en Progressive Web App (PWA) med:

- **Interaktiva kurser** med WYSIWYG-redigerare
- **Quiz och examinationer** med Blooms taxonomi
- **AI-driven lärande** med personlig tutor
- **Certifiering** med LIPUS-godkännande
- **BankID-autentisering** för säker inloggning
- **Offline-stöd** för lärande utan uppkoppling
- **Mobilapp** via Capacitor (iOS/Android)

## 🏗 Teknisk Stack

### Frontend (apps/web)
- **React 19** med TypeScript
- **Vite** för snabb utveckling
- **TailwindCSS** för styling
- **React Router v7** för routing
- **Zustand** för state management
- **React Query** för data fetching
- **Framer Motion** för animationer
- **i18next** för internationalisering

### Backend (apps/api)
- **NestJS 10** med TypeScript
- **Prisma ORM** med PostgreSQL
- **Redis** för caching och sessions
- **Socket.io** för realtidskommunikation
- **JWT** för autentisering
- **Swagger** för API-dokumentation

### Infrastruktur
- **Docker** & Docker Compose
- **GitHub Actions** för CI/CD
- **Nginx** som reverse proxy
- **AWS S3** för fillagring

## 🚀 Snabbstart

### Förutsättningar

- Node.js 20+
- Docker & Docker Compose
- npm eller pnpm

### Installation

```bash
# Klona repot
git clone https://github.com/your-org/b-ortim.git
cd b-ortim

# Installera dependencies
npm install --legacy-peer-deps

# Kopiera miljövariabler
cp .env.example .env

# Starta databas och Redis
docker-compose up -d db redis

# Generera Prisma client
npx prisma generate

# Kör databasmigrering
npx prisma db push

# (Valfritt) Seed databas med testdata
npx prisma db seed

# Starta utvecklingsservern
npm run dev
```

Applikationen är nu tillgänglig på:
- **Web:** http://localhost:3000
- **API:** http://localhost:4000
- **API Docs:** http://localhost:4000/api/docs

## 📁 Projektstruktur

```
b-ortim/
├── apps/
│   ├── api/                 # NestJS backend
│   │   ├── src/
│   │   │   ├── auth/        # Autentisering (JWT, BankID)
│   │   │   ├── courses/     # Kurshantering
│   │   │   ├── quiz/        # Quiz och examinationer
│   │   │   ├── certificates/# Certifikat
│   │   │   ├── instructor/  # Instruktörsfunktioner
│   │   │   ├── admin/       # Administratörsfunktioner
│   │   │   ├── analytics/   # Lärandeanalys
│   │   │   └── ...
│   │   └── Dockerfile
│   │
│   └── web/                 # React frontend
│       ├── src/
│       │   ├── pages/       # Sidor
│       │   ├── components/  # Återanvändbara komponenter
│       │   ├── hooks/       # Custom hooks
│       │   ├── stores/      # Zustand stores
│       │   ├── lib/         # Utilities
│       │   └── styles/      # Globala stilar
│       └── Dockerfile
│
├── packages/
│   └── shared/              # Delad kod mellan apps
│
├── prisma/
│   └── schema.prisma        # Databasschema
│
├── scripts/                 # Deployment & backup scripts
│   ├── deploy-staging.sh
│   ├── deploy-production.sh
│   ├── backup-database.sh
│   └── restore-database.sh
│
├── e2e/                     # End-to-end tester (Playwright)
│
├── docker-compose.yml       # Lokal utveckling
└── nginx.conf               # Produktionskonfiguration
```

## 🔐 Miljövariabler

Se `.env.example` för alla tillgängliga variabler. Kritiska variabler:

| Variabel | Beskrivning |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Hemlig nyckel för JWT tokens |
| `CRIIPTO_*` | BankID/Criipto konfiguration |
| `VAPID_*` | Push notification nycklar |
| `SMTP_*` | E-postkonfiguration |
| `SENTRY_DSN` | Felspårning |

## 🧪 Tester

```bash
# Kör alla enhetstester
npm test

# Kör tester med coverage
npm run test:cov

# Kör E2E-tester
npx playwright test

# Kör specifika testfiler
npm test -- auth.service.spec.ts
```

## 🚢 Deployment

### Staging

```bash
# Manuell deployment
STAGING_HOST=staging.example.com ./scripts/deploy-staging.sh

# Eller via GitHub Actions (automatiskt vid push till main)
```

### Produktion

```bash
# Manuell deployment (kräver bekräftelse)
PRODUCTION_HOST=app.example.com IMAGE_TAG=v1.2.3 ./scripts/deploy-production.sh
```

### GitHub Secrets

Konfigurera följande secrets i GitHub:

- `STAGING_HOST`, `STAGING_USER`, `STAGING_SSH_KEY`
- `PRODUCTION_HOST`, `PRODUCTION_USER`, `PRODUCTION_SSH_KEY`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
- `AWS_S3_BACKUP_BUCKET`
- `SLACK_WEBHOOK_URL` (valfritt)

## 📊 Databasbackup

Automatiska backups körs dagligen kl 02:00 UTC via GitHub Actions.

```bash
# Manuell backup
./scripts/backup-database.sh production

# Återställ backup
./scripts/restore-database.sh /backups/bortim_production_20240115.dump
```

## 📱 Mobilapp

Projektet använder Capacitor för att bygga native mobilappar.

```bash
# iOS
npx cap add ios
npx cap sync ios
npx cap open ios

# Android
npx cap add android
npx cap sync android
npx cap open android
```

## 🔧 Utveckling

### Kodstil

- ESLint för linting
- Prettier för formatering
- TypeScript strict mode

```bash
# Lint
npm run lint

# Formatera
npm run format

# Typkontroll
npm run typecheck
```

### Branches

- `main` - Produktion
- `develop` - Utveckling
- `feature/*` - Nya funktioner
- `fix/*` - Bugfixar

## 📚 API-dokumentation

Swagger-dokumentation finns på `/api/docs` i utvecklingsläge.

### Viktiga endpoints

| Metod | Endpoint | Beskrivning |
|-------|----------|-------------|
| POST | `/api/auth/bankid` | BankID-autentisering |
| GET | `/api/courses` | Lista kurser |
| GET | `/api/courses/:id/chapters` | Hämta kapitel |
| POST | `/api/quiz/submit` | Skicka quiz-svar |
| GET | `/api/certificates` | Lista certifikat |

## 🛡 Säkerhet

- JWT med refresh tokens
- BankID för stark autentisering
- Rate limiting (100 req/min)
- CORS-skydd
- Helmet.js säkerhetsheaders
- Input-validering med class-validator
- Sentry för felspårning

## 📈 Övervakning

- **Sentry** - Felspårning och prestandamätning
- **Health endpoint** - `/api/health`
- **Slack-notifikationer** - Deployment och backup status

## 🤝 Bidra

1. Forka repot
2. Skapa en feature branch (`git checkout -b feature/amazing-feature`)
3. Committa ändringar (`git commit -m 'Add amazing feature'`)
4. Pusha till branchen (`git push origin feature/amazing-feature`)
5. Öppna en Pull Request

## 📄 Licens

Proprietary - Alla rättigheter förbehållna.

## 📞 Support

- **E-post:** support@bortim.se
- **Issues:** GitHub Issues
