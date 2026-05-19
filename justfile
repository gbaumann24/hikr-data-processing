set dotenv-load := true

# List all recipes
default:
    @just --list

# ── Dev ────────────────────────────────────────────────────────────────────────

# Start Mastra dev server
dev:
    bun run --cwd apps/agent dev

# ── Pipeline ───────────────────────────────────────────────────────────────────

# Run climbing pipeline against local SQLite export (no DB writes)
run-sqlite limit="":
    HIKR_SQLITE_PATH=hikr.sqlite {{ if limit != "" { "LIMIT=" + limit } else { "" } }} bun run apps/data-pipeline/src/run-sqlite.ts

# Run climbing pipeline against Postgres (writes results to DB)
run limit="":
    {{ if limit != "" { "LIMIT=" + limit } else { "" } }} bun run apps/data-pipeline/src/run.ts

# ── DB ────────────────────────────────────────────────────────────────────────

# Generate Prisma client
db-generate:
    bun run --cwd packages/db generate

# Run Prisma migrations
db-migrate:
    prisma migrate dev --schema packages/db/prisma

# ── Quality ────────────────────────────────────────────────────────────────────

# Run all tests
test:
    bun test --cwd apps/agent
    bun test --cwd apps/data-pipeline

# Typecheck all packages
typecheck:
    for dir in packages/types packages/utils packages/db apps/agent apps/data-pipeline; do \
        echo "→ $dir" && bun run --cwd "$dir" typecheck; \
    done
