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

# Push schema to DB (syncs without migration history, safe for dev)
db-push:
    bun run --cwd packages/db node_modules/.bin/prisma db push --schema prisma

# Apply pending migrations
db-migrate:
    bun run --cwd packages/db node_modules/.bin/prisma migrate deploy --schema prisma

# Create a new migration (name required: just db-create-migration add-my-table)
db-create-migration name:
    bun run --cwd packages/db node_modules/.bin/prisma migrate dev --schema prisma --name {{ name }}

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
