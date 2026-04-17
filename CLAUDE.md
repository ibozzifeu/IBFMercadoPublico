# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev            # Start dev server (localhost:3000)
npm run build          # Production build
npm run type-check     # TypeScript check without emitting
npm run lint           # ESLint
npm run format         # Prettier on src/**

# Prisma
npx prisma migrate dev --name <name>   # Create and apply migration
npx prisma migrate reset               # Reset DB (drops all data)
npx prisma studio                      # Visual DB explorer

# Run sync manually (requires dev server running)
curl -X POST http://localhost:3000/api/sync \
  -H "x-cron-secret: $(grep CRON_SECRET .env.local | cut -d= -f2)"
```

## Environment

All secrets are server-only — no `NEXT_PUBLIC_` prefix on API keys or tokens. Required vars in `.env.local`:

- `DATABASE_URL` — PostgreSQL connection string
- `MP_TICKET` / `MP_BASE_URL` — Mercado Público API credentials
- `GEMINI_API_KEY` / `GEMINI_MODEL` — Google Gemini (default: `gemini-2.0-flash`)
- `AUTH_SECRET` / `AUTH_USERNAME` / `AUTH_PASSWORD` — NextAuth credentials
- `CRON_SECRET` — protects `POST /api/sync`

## Architecture

### Data flow

```
API Mercado Público → /api/sync → clasificador.ts → PostgreSQL
                                                        ↓
Browser → login → NextAuth JWT → middleware → API routes → Prisma → PostgreSQL
                                                              ↓
                                                        Gemini API (on demand)
```

### Auth & middleware

`src/auth.ts` exports `{ handlers, auth, signIn, signOut }` — the NextAuth v5 entrypoint. `src/middleware.ts` reads `req.auth` to protect routes. API routes return `401 JSON` (not redirect) so client `fetch()` calls don't break. Protected paths: `/licitaciones/*`, `/dashboard/*`, `/api/licitaciones/*`, `/api/analizar/*`. `/api/sync` uses `x-cron-secret` header instead of NextAuth (no session in cron context).

### Database client

`src/lib/api/db.ts` exports `db` (not `prisma`) — a singleton PrismaClient. Always import as `import { db } from '@/lib/api/db'`.

### Sync service

`src/lib/services/sync.ts` orchestrates the full pipeline: fetch from API → `transformarLicitacion()` → classify with `clasificador.ts` → upsert in batches of 10 → record in `historial_sincronizacion`. New licitaciones are created with their items in a nested `create`; existing ones are updated without touching items.

### Classification

`src/lib/services/clasificador.ts` uses a weighted keyword dictionary to assign one of 6 categories: `Software/Sistemas`, `Hardware/Equipos`, `Redes/Telecomunicaciones`, `Seguridad TI`, `Servicios TI`, `Tecnología General`. Specific terms (ERP, VPN, antivirus) carry higher weight than generic ones (sistema, servicio).

### Gemini integration

`src/lib/api/gemini.ts` exports three functions: `generarResumenEjecutivo`, `clasificarLicitacion` (JSON response), `generarAnalisisRiesgos`. The `POST /api/analizar` route calls `generarResumenEjecutivo` and caches the result in `analisis_ia` table (unique constraint on `[licitacionId, tipoAnalisis]`).

### Rate limiting

`src/lib/ratelimit.ts` — in-memory Map, 10 req/min per IP, applied in all three API route handlers. Returns standard `X-RateLimit-*` headers. Not suitable for multi-instance deployments (use Redis/Upstash instead).

## Key constraints

- Dynamic route directories must use literal brackets `[param]` — escaped paths like `\[param\]` are silently ignored by Next.js.
- NextAuth v5 is installed as `next-auth@beta`. Install with `--legacy-peer-deps`.
- `historial_sincronizacion.estado` accepts free-form strings: `'ejecutando'`, `'exitosa'`, `'parcial'`, `'fallida'`.
- Prisma `take: 200` on items and `take: 1` on `analisisIA` in the detail route — prevents unbounded joins.
