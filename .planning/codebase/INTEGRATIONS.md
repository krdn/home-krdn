# External Integrations

**Analysis Date:** 2026-01-14

## APIs & External Services

**Payment Processing:**
- Not detected

**Email/SMS:**
- Not detected

**External APIs:**
- Not detected (no third-party API integrations found)

## Data Storage

**Databases:**
- Not detected (no database connection in codebase)
- Static service configuration stored in `src/config/services.ts`

**File Storage:**
- Local filesystem only

**Caching:**
- Not detected (no Redis/caching layer)

## Authentication & Identity

**Auth Provider:**
- Not implemented - All routes are publicly accessible
- No authentication middleware in `src/app/` or `middleware.ts`

**OAuth Integrations:**
- Not detected

## Monitoring & Observability

**Error Tracking:**
- Not detected (no Sentry or similar)

**Analytics:**
- Not detected

**Logs:**
- Console logging only (`console.log`, `console.error`)
- Docker container logs accessible via API

## CI/CD & Deployment

**Hosting:**
- Docker Compose deployment (`docker-compose.yml`)
- Services: Next.js app + Nginx reverse proxy
- Network: Bridge network (`home-krdn-network`)
- Port: 8082 (external) → 80 (nginx) → 3005 (app)

**CI Pipeline:**
- Not detected (no GitHub Actions or CI configuration)

## Environment Configuration

**Development:**
- Required env vars: None strictly required
- Optional: `DOCKER_HOST` (defaults to `/var/run/docker.sock`)
- Scripts: `npm run dev` starts development server

**Staging:**
- Not configured

**Production:**
- Docker-based deployment
- Environment vars set in `Dockerfile`:
  - `NODE_ENV=production`
  - `NEXT_TELEMETRY_DISABLED=1`
  - `PORT=3005`
- Docker socket mounted for container management

## Webhooks & Callbacks

**Incoming:**
- Not detected

**Outgoing:**
- Not detected

## System Integrations

**Docker Daemon:**
- Unix socket integration via `/var/run/docker.sock`
- Client: Custom HTTP client over Unix socket (`src/lib/docker.ts`)
- Capabilities:
  - List containers: `GET /containers/json`
  - Get container: `GET /containers/{id}/json`
  - Start/Stop/Restart: `POST /containers/{id}/{action}`
  - Logs: `GET /containers/{id}/logs`
  - System info: `GET /info`, `GET /version`

**System Metrics:**
- CPU: `/proc/stat` parsing or `os.loadavg()` fallback (`src/lib/system.ts`)
- Memory: `os.totalmem()`, `os.freemem()` (`src/lib/system.ts`)
- Disk: `df -B1` command execution (`src/lib/system.ts`)
- System info: `os.hostname()`, `os.cpus()`, `os.uptime()`

## Internal API Endpoints

| Endpoint | Method | Description | Handler |
|----------|--------|-------------|---------|
| `/api/system` | GET | System metrics (CPU, memory, disk, uptime) | `src/app/api/system/route.ts` |
| `/api/docker/containers` | GET | List all Docker containers | `src/app/api/docker/containers/route.ts` |
| `/api/docker/containers/[id]` | GET | Get specific container details | `src/app/api/docker/containers/[id]/route.ts` |
| `/api/docker/containers/[id]` | POST | Container actions (start/stop/restart/logs) | `src/app/api/docker/containers/[id]/route.ts` |

## Referenced Services (from config)

Services managed/monitored (defined in `src/config/services.ts`):

**AI Services:**
- Gonsai2 - AI-optimized n8n workflow
- AI Note Taking - Claude API integration
- Claude Code Auto - Automation tool
- LinkedIn Automation - OpenAI + LangChain

**N8N/Automation:**
- n8n - Workflow automation (400+ integrations)
- News Sentiment Analyzer - Django + Streamlit + Celery
- n8n Agent Generator - AI workflow creation

**Infrastructure:**
- Open WebUI - LLM interface
- Code Server - Browser-based VS Code
- Portainer - Docker management UI
- Home KRDN - This project

---

*Integration audit: 2026-01-14*
*Update when adding/removing external services*
