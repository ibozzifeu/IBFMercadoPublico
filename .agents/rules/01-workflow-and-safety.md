---
trigger: always_on
---

---
name: Workflow & Safety Guardrails
scope: global
activation: always_on
---

# 1. Identity & Git Synchronization
- **GitHub Account:** The agent must verify the active `gh` account is `ibozzifeu` via `gh auth switch --user ibozzifeu` before any remote operations.
- **Sync Protocol:** Always run `git fetch origin` and compare `HEAD..origin/main`. If the remote is ahead and the working tree is clean, execute `git pull origin main`. If there are uncommitted local changes, halt and alert the user.
- **Branching:** Non-trivial features (affecting multiple files, schemas, APIs) must use `feature/[name]`. Small isolated changes can go directly to `main`.

# 2. Safety & Approvals
- **Analysis First:** When asked to analyze a change, the agent must output suggested steps WITHOUT modifying code. ALWAYS request explicit approval before applying changes.
- **Risky Operations (CRITICAL):** If modifying database records or performing dangerous operations, the agent MUST ASK FOR APPROVAL 2 TIMES IN ALL CAPS before proceeding.
- **SQL Migrations:** Any PostgreSQL schema change must be presented as a raw SQL script for review first. Do not execute `prisma migrate` without permission.

# 3. Commit Convention
- Format: `type: descripción en español`.
- Valid types: `feat`, `fix`, `chore`, `docs`, `refactor`, `style`.
- Forbidden: vague messages like "arreglos" or "wip".