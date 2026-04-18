# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Reglas de trabajo

**Cuenta GitHub:** Al inicio de cada sesión, verificar que la cuenta activa de gh sea carlosmartinezcl. Si no lo es, ejecutar `gh auth switch --user carlosmartinezcl` antes de cualquier operación con el repositorio remoto.

**Sincronización con remoto:** Después de verificar la cuenta, ejecutar `git fetch origin` y comparar con la rama local (`git log HEAD..origin/main --oneline`). Si el remoto tiene commits más nuevos: (a) si el working tree está limpio → `git pull origin main`; (b) si hay cambios locales sin commitear → avisar a Carlos antes de proceder.

**Análisis de cambios:** Cuando se solicite un análisis de cambio, preparar un listado de pasos sugeridos SIN realizar modificaciones. Siempre pedir aprobación de Carlos antes de aplicar los cambios.

**Cambios riesgosos:** Si un cambio involucra riesgos (por ejemplo, alterar registros de base de datos o similares), preguntar 2 VECES EN MAYÚSCULAS si estás de acuerdo antes de proceder.

**Convención de commits:** Usar siempre el formato `tipo: descripción en español`. Tipos válidos: `feat` (nueva funcionalidad), `fix` (corrección de bug), `chore` (tareas de mantenimiento), `docs` (documentación), `refactor` (reestructuración sin cambio de comportamiento), `style` (formato/estilos). No usar mensajes vagos como "arreglos" o "wip".

**Migraciones SQL:** Cualquier cambio de schema en PostgreSQL (tablas, columnas, índices) debe presentarse primero como script SQL completo para revisión de Carlos. No ejecutar ninguna migración sin aprobación explícita.

**Ramas para features no triviales:** Cambios que afecten múltiples archivos, rutas de API o el schema de base de datos deben desarrollarse en una rama separada (`feature/nombre-feature`). Solo se hace merge a main cuando la feature está completa y revisada. Cambios pequeños y aislados pueden ir directo a main.

## Token Efficient Rules

- Think before acting. Read existing files before writing code.
- Be concise in output but thorough in reasoning.
- Prefer editing over rewriting whole files.
- Do not re-read files you have already read unless the file may have changed.
- Test your code before declaring done.
- No sycophantic openers or closing fluff.
- Keep solutions simple and direct.
- User instructions always override this file.

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
