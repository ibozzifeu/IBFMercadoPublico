---
trigger: always_on
---

---
name: Project Architecture & Flow
scope: global
activation: always_on
---

# 1. Authentication & Middleware
- Use NextAuth v5 (`src/auth.ts`) as the entrypoint.
- Protected routes include `/licitaciones/*`, `/dashboard/*`, and API routes. API routes must return `401 JSON` (not redirects).
- `/api/sync` bypasses NextAuth and uses the `x-cron-secret` header instead.

# 2. Database & Data Flow
- **Singleton Client:** Always import the database client as `import { db } from '@/lib/api/db'`. Never import `PrismaClient` directly in feature files.
- **Sync Logic:** `src/lib/services/sync.ts` orchestrates the pipeline. Upserts happen in batches of 10. The "purge" step only runs if the API returns >= 100 items to prevent mass deletion.

# 3. AI Modules (Gemini & Ollama)
- **Gemini:** Used for executive summaries, classification, and risk analysis (`src/lib/api/gemini.ts`). Analysis is cached in the `analisis_ia` table to prevent re-generation.
- **Ollama:** Local models have a 90-second timeout. Requests must be serialized via `ollamaQueue` mutex to avoid racing.

# 4. Constraints
- Dynamic routes must use literal brackets `[param]`.
- Prevent unbounded joins by enforcing `take: 200` on items and `take: 1` on `analisisIA`.
- Rate limiting (`src/lib/ratelimit.ts`) is currently in-memory (10 req/min/IP).