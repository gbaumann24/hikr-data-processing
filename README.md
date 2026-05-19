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

Format code before opening a PR:

```sh
bun run format
bun run format:check
```

Run data-pipeline workflows separately:

```sh
bun run --cwd apps/data-pipeline run:baselayer
bun run --cwd apps/data-pipeline run:climbing
```

Run an interactive climbing test against local Postgres. This purges the test DB,
seeds the requested number of source posts from `hikr.sqlite`, then runs the
climbing workflow:

```sh
bun run --cwd apps/data-pipeline test-run:climbing
bun run --cwd apps/data-pipeline test-run:climbing -- --limit 25
bun run --cwd apps/data-pipeline test-run:climbing -- --limit 25 --sqlite-path ../../hikr.sqlite
just test-run-climbing 25
```
