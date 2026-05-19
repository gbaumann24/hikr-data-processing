# HIKR Data Processing

Turbo/Bun monorepo for processing HIKR exports.

## Workspaces

- `agent`: Mastra agents.
- `apps/data-pipeline`: Stateless preprocessing logic.
- `packages/db`: Prisma schema files for the enriched database.
- `packages/shared`: Cross-app contracts and constants derived from the DB schema.

## Commands

```sh
bun install
bun run typecheck
bun run test
bun run build
```

Run data-pipeline workflows separately:

```sh
bun run --cwd apps/data-pipeline run:baselayer
bun run --cwd apps/data-pipeline run:climbing
HIKR_SQLITE_PATH=/path/to/hikr.sqlite bun run --cwd apps/data-pipeline run:sqlite:baselayer
HIKR_SQLITE_PATH=/path/to/hikr.sqlite bun run --cwd apps/data-pipeline run:sqlite:climbing
```
