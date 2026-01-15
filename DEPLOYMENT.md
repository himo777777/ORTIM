# B-ORTIM Deployment Runbook

## Innehåll

1. [Förutsättningar](#förutsättningar)
2. [Infrastruktur](#infrastruktur)
3. [Första deployment](#första-deployment)
4. [Vanlig deployment](#vanlig-deployment)
5. [Rollback](#rollback)
6. [Övervakning](#övervakning)
7. [Felsökning](#felsökning)
8. [Databashantering](#databashantering)
9. [Incidenthantering](#incidenthantering)

---

## Förutsättningar

### Verktyg som krävs

- Docker & Docker Compose
- Node.js 20+
- PostgreSQL client (psql)
- AWS CLI (för S3 backups)
- SSH access till servrar

### Miljöer

| Miljö | URL | Beskrivning |
|-------|-----|-------------|
| Development | localhost:3000 | Lokal utveckling |
| Staging | staging.bortim.se | Testmiljö |
| Production | app.bortim.se | Produktionsmiljö |

### GitHub Secrets som krävs

```
# Staging
STAGING_HOST          # IP/hostname för staging-server
STAGING_USER          # SSH-användare (vanligtvis 'deploy')
STAGING_SSH_KEY       # Privat SSH-nyckel

# Production
PRODUCTION_HOST       # IP/hostname för produktions-server
PRODUCTION_USER       # SSH-användare
PRODUCTION_SSH_KEY    # Privat SSH-nyckel

# AWS
AWS_ACCESS_KEY_ID     # För S3 backups
AWS_SECRET_ACCESS_KEY
AWS_REGION
AWS_S3_BACKUP_BUCKET

# Notifikationer
SLACK_WEBHOOK_URL     # För deployment-notifikationer
```

---

## Infrastruktur

### Serverarkitektur

```
                    ┌─────────────┐
                    │   Nginx     │
                    │  (SSL/LB)   │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────┴──────┐ ┌──────┴──────┐ ┌──────┴──────┐
    │   Web App   │ │   API App   │ │  WebSocket  │
    │  (React)    │ │  (NestJS)   │ │  (Socket.io)│
    └─────────────┘ └──────┬──────┘ └─────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────┴──────┐ ┌──────┴──────┐ ┌──────┴──────┐
    │ PostgreSQL  │ │    Redis    │ │   S3/Minio  │
    └─────────────┘ └─────────────┘ └─────────────┘
```

### Portar

| Service | Port | Beskrivning |
|---------|------|-------------|
| Nginx | 80, 443 | HTTP/HTTPS |
| Web | 3000 | React frontend |
| API | 4000 | NestJS backend |
| PostgreSQL | 5432 | Databas |
| Redis | 6379 | Cache |

---

## Första deployment

### 1. Förbered servern

```bash
# SSH till servern
ssh deploy@your-server.com

# Skapa mappar
sudo mkdir -p /opt/bortim
sudo mkdir -p /backups
sudo chown -R deploy:deploy /opt/bortim /backups

# Installera Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker deploy

# Installera Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Kopiera filer

```bash
# Från lokal maskin
scp docker-compose.yml deploy@server:/opt/bortim/
scp nginx.conf deploy@server:/opt/bortim/
scp .env.production deploy@server:/opt/bortim/.env
scp -r scripts/ deploy@server:/opt/bortim/
```

### 3. Konfigurera miljövariabler

```bash
# På servern
cd /opt/bortim
nano .env

# Fyll i ALLA värden, speciellt:
# - DATABASE_URL
# - JWT_SECRET (generera ny med: openssl rand -base64 48)
# - JWT_REFRESH_SECRET
# - CRIIPTO_* (BankID credentials)
# - SMTP_* (e-post)
# - VAPID_* (push notifications)
# - SENTRY_DSN
```

### 4. Starta tjänster

```bash
cd /opt/bortim

# Starta databas och redis först
docker-compose up -d db redis

# Vänta på att de startar
sleep 10

# Kör databas-migrering
docker-compose run --rm api npx prisma migrate deploy

# Starta övriga tjänster
docker-compose up -d
```

### 5. Konfigurera SSL (Let's Encrypt)

```bash
# Installera certbot
sudo apt install certbot python3-certbot-nginx

# Generera certifikat
sudo certbot --nginx -d app.bortim.se -d api.bortim.se

# Auto-renewal (redan konfigurerat via cron)
sudo certbot renew --dry-run
```

---

## Vanlig deployment

### Via GitHub Actions (Rekommenderat)

1. Pusha till `main`-branchen
2. CI/CD körs automatiskt:
   - Lint & typecheck
   - Tester
   - Bygg Docker-images
   - Deploy till staging
   - (Manuellt godkännande)
   - Deploy till produktion

### Manuell deployment

```bash
# Staging
export STAGING_HOST=staging.bortim.se
export IMAGE_TAG=latest
./scripts/deploy-staging.sh

# Produktion (kräver bekräftelse)
export PRODUCTION_HOST=app.bortim.se
export IMAGE_TAG=v1.2.3  # Specifik version!
./scripts/deploy-production.sh
```

### Deployment-checklist

- [ ] Alla tester passerar
- [ ] Staging-deployment lyckades
- [ ] Staging testad manuellt
- [ ] Databas-backup taget
- [ ] Teamet informerat
- [ ] Support-kanaler övervakade

---

## Rollback

### Snabb rollback

```bash
# SSH till servern
ssh deploy@production-server

cd /opt/bortim

# Se tidigare versioner
docker images | grep b-ortim

# Byt till tidigare version
export API_IMAGE=ghcr.io/your-org/b-ortim/api:previous-sha
export WEB_IMAGE=ghcr.io/your-org/b-ortim/web:previous-sha

docker-compose up -d api web
```

### Databasrollback

⚠️ **VARNING**: Detta återställer databas till tidigare tillstånd!

```bash
# Lista tillgängliga backups
ls -la /backups/

# Välj backup att återställa
./scripts/restore-database.sh /backups/bortim_production_20240115_020000.dump
```

---

## Övervakning

### Health Checks

```bash
# Basic health
curl https://api.bortim.se/api/health

# Detaljerad status (med dependencies)
curl https://api.bortim.se/api/health/detailed

# Kubernetes probes
curl https://api.bortim.se/api/health/ready  # Readiness
curl https://api.bortim.se/api/health/live   # Liveness
```

### Exempel-svar (health/detailed)

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "b-ortim-api",
  "version": "1.0.0",
  "uptime": 86400,
  "dependencies": {
    "database": { "status": "up", "latency": 5 },
    "redis": { "status": "up", "latency": 2 }
  }
}
```

### Loggar

```bash
# Alla tjänster
docker-compose logs -f

# Specifik tjänst
docker-compose logs -f api

# Senaste 100 rader
docker-compose logs --tail=100 api

# Med timestamps
docker-compose logs -t api
```

### Metrics

- **Sentry**: https://sentry.io/your-org/b-ortim/
- **Uptime**: Konfigureras i externa tjänster (Uptime Robot, etc.)

---

## Felsökning

### Tjänst startar inte

```bash
# Kolla logs
docker-compose logs api

# Vanliga problem:
# 1. DATABASE_URL fel → Kontrollera .env
# 2. Port redan upptagen → netstat -tlnp | grep 4000
# 3. Prisma ej genererat → docker-compose run --rm api npx prisma generate
```

### Databasanslutning misslyckas

```bash
# Testa anslutning direkt
docker-compose exec db psql -U bortim -d bortim -c "SELECT 1"

# Kontrollera att db kör
docker-compose ps db

# Se db-loggar
docker-compose logs db
```

### Redis-problem

```bash
# Testa Redis
docker-compose exec redis redis-cli ping

# Se minneanvändning
docker-compose exec redis redis-cli info memory
```

### Högt CPU/minne

```bash
# Se resurser per container
docker stats

# Starta om specifik tjänst
docker-compose restart api
```

### SSL-problem

```bash
# Förnya certifikat
sudo certbot renew

# Kontrollera certifikat
sudo certbot certificates

# Testa SSL
curl -vI https://api.bortim.se/api/health
```

---

## Databashantering

### Daglig backup

Körs automatiskt via GitHub Actions kl 02:00 UTC.

```bash
# Manuell backup
./scripts/backup-database.sh production

# Backups sparas i:
# - /backups/ (lokalt)
# - s3://bucket/db-backups/ (AWS)
```

### Migreringar

```bash
# Skapa ny migration (utveckling)
npx prisma migrate dev --name describe_change

# Applicera migreringar (produktion)
docker-compose exec api npx prisma migrate deploy

# Se migrationsstatus
docker-compose exec api npx prisma migrate status
```

### Databasunderhåll

```bash
# Vacuum (frigör utrymme)
docker-compose exec db psql -U bortim -d bortim -c "VACUUM ANALYZE"

# Se tabellstorlekar
docker-compose exec db psql -U bortim -d bortim -c "
  SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
  FROM pg_catalog.pg_statio_user_tables
  ORDER BY pg_total_relation_size(relid) DESC
  LIMIT 10;
"
```

---

## Incidenthantering

### Allvarlighetsnivåer

| Nivå | Beskrivning | Svarstid |
|------|-------------|----------|
| P1 | Systemet nere | Omedelbart |
| P2 | Stor funktionalitet påverkad | 1 timme |
| P3 | Mindre problem | 4 timmar |
| P4 | Kosmetiskt/låg prioritet | Nästa arbetsdag |

### P1 - Systemet nere

1. **Identifiera** - Kör health check
   ```bash
   curl https://api.bortim.se/api/health/detailed
   ```

2. **Kommunicera** - Informera i Slack
   ```
   @here 🔴 B-ORTIM är nere. Undersöker.
   ```

3. **Diagnostisera** - Kolla loggar
   ```bash
   docker-compose logs --tail=100
   ```

4. **Åtgärda**
   - Om databas: Starta om `docker-compose restart db`
   - Om API: Starta om `docker-compose restart api`
   - Om allvarligt: Rollback till tidigare version

5. **Verifiera** - Kör health check igen

6. **Dokumentera** - Skriv incident report

### Kontaktlista

| Roll | Kontakt |
|------|---------|
| On-call | Se PagerDuty/schema |
| Teknik-lead | namn@bortim.se |
| Operations | ops@bortim.se |

---

## Appendix

### Användare kommandon

```bash
# Skapa admin-användare
docker-compose exec api npx ts-node scripts/create-admin.ts

# Lista användare
docker-compose exec db psql -U bortim -d bortim -c "SELECT id, personnummer, role FROM \"User\""
```

### Rensa cache

```bash
# Rensa all Redis-cache
docker-compose exec redis redis-cli FLUSHDB

# Rensa specifik cache
docker-compose exec api node -e "
  const Redis = require('ioredis');
  const r = new Redis(process.env.REDIS_URL);
  r.keys('bortim:*').then(keys => keys.length && r.del(...keys));
"
```

### Logs retention

- **Container logs**: Roteras automatiskt (max 10MB per fil, 3 filer)
- **Databas backups**: 30 dagar lokalt, 90 dagar i S3
- **Audit logs**: 1 år i databas

---

*Senast uppdaterad: 2024-01-15*
