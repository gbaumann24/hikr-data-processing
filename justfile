set dotenv-load := true

# Show available recipes
help:
    @just --list

# Show available recipes
default:
    @just help

# ── Dev ────────────────────────────────────────────────────────────────────────

# Start Mastra dev server
dev:
    bun run --cwd apps/agent dev

# ── Pipeline ───────────────────────────────────────────────────────────────────

# Run climbing pipeline against Postgres (writes results to DB)
run limit="":
    {{ if limit != "" { "LIMIT=" + limit } else { "" } }} bun run apps/data-pipeline/src/run.ts

# Purge local Postgres, seed source posts from SQLite, then run climbing pipeline
test-run-climbing limit="":
    bun run apps/data-pipeline/src/run-climbing-test.ts {{ if limit != "" { "--limit " + limit } else { "" } }}

# Purge local Postgres, seed the Furkahorn fixture, then run climbing pipeline
test-run-climbing-furkahorn limit="":
    bun run apps/data-pipeline/src/run-climbing-test.ts --furkahorn {{ if limit != "" { "--limit " + limit } else { "" } }}

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

# Format all supported files with the shared Prettier config
format:
    bun run format

# Check formatting without writing changes
format-check:
    bun run format:check

# Typecheck all packages
typecheck:
    for dir in packages/types packages/utils packages/db apps/agent apps/data-pipeline; do \
        echo "→ $dir" && bun run --cwd "$dir" typecheck; \
    done
