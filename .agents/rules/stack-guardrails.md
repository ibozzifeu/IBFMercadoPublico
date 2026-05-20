---
name: Next.js 15 & Prisma Architecture Guardrails
scope: global
activation: always_on
---

# Core Architectural Constraints

## 1. Next.js 15 (App Router) Standard
- The agent must strictly adhere to the Next.js App Router paradigm (`app/` directory).
- React Server Components (RSC) are the default. `use client` directives must only be added when hooks (`useState`, `useEffect`) or DOM interactivity are strictly required.
- All backend mutations must be handled via Server Actions, located in dedicated `actions/` directories or defined inline with `"use server"`.
- Avoid legacy Next.js imports (e.g., `next/router`). Use `next/navigation` for routing.

## 2. Database & Prisma Transactions
- All database operations must be executed via the Prisma Client instance.
- The agent must verify schema relations before proposing database reads/writes.
- Never propose raw SQL queries unless explicitly authorized by the user via the `/goal` command.
- If schema modifications are proposed, the agent must append instructions to run `npx prisma db push` or `npx prisma migrate dev`.

## 3. Local AI Integration (Ollama)
- When interacting with scripts in `scripts/carga-inicial/` involving Ollama, ensure local port assumptions (default `http://localhost:11434`) are respected and connection timeouts are handled gracefully.
