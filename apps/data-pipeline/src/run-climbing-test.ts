import { stdin as input, stdout as output } from 'node:process';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { PrismaClient, purgePipelineOutput } from '@hikr/db';
import { loadRootEnv } from '@hikr/utils';
import {
  runClimbingTourAggregationService,
  type ClimbingTourAggregationProgressEvent,
} from './climbing-aggregation';
import { createMastraClimbingTourAggregationSummarizer } from './climbing-aggregation/agent-caller';
import { createPostgresDatabase } from './database/postgres';
import { seedHikrReportsFromSqlite } from './database/sqlite-source-seed';
import type { ClimbingPipelineProgressEvent } from './utils/workflow-runner';

const DEFAULT_LIMIT = 10;
const SPECIAL_CASE_FIXTURE_SQLITE_PATH = 'apps/data-pipeline/fixtures/special-case.sqlite';

type ParsedArgs = {
  help: boolean;
  limit?: number;
  sqlitePath?: string;
  useSpecialCaseFixture: boolean;
};

function parsePositiveInteger(value: string, label: string): number {
  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive whole number`);
  }

  return parsed;
}

function parseArgs(args: string[]): ParsedArgs {
  let limit: number | undefined;
  let sqlitePath: string | undefined;
  let useSpecialCaseFixture = false;

  const setLimit = (value: string): void => {
    if (limit !== undefined) {
      throw new Error('Only one limit value can be provided');
    }

    limit = parsePositiveInteger(value, 'Limit');
  };

  const setSqlitePath = (value: string): void => {
    if (sqlitePath !== undefined) {
      throw new Error('Only one SQLite path can be provided');
    }

    sqlitePath = value;
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--help' || arg === '-h') {
      return { help: true, useSpecialCaseFixture: false };
    }

    if (arg === '--special-case') {
      useSpecialCaseFixture = true;
      continue;
    }

    if (arg === '--limit' || arg === '-l') {
      const value = args[index + 1];

      if (!value) {
        throw new Error(`${arg} requires a value`);
      }

      setLimit(value);
      index += 1;
      continue;
    }

    if (arg === '--sqlite-path') {
      const value = args[index + 1];

      if (!value) {
        throw new Error(`${arg} requires a value`);
      }

      setSqlitePath(value);
      index += 1;
      continue;
    }

    if (arg.startsWith('--limit=')) {
      setLimit(arg.slice('--limit='.length));
      continue;
    }

    if (arg.startsWith('--sqlite-path=')) {
      setSqlitePath(arg.slice('--sqlite-path='.length));
      continue;
    }

    if (arg.startsWith('-')) {
      throw new Error(`Unsupported option: ${arg}`);
    }

    setLimit(arg);
  }

  if (useSpecialCaseFixture && sqlitePath !== undefined) {
    throw new Error('Use either --special-case or --sqlite-path, not both');
  }

  return { help: false, limit, sqlitePath, useSpecialCaseFixture };
}

function printUsage(): void {
  console.log(`Usage:
  bun src/run-climbing-test.ts
  bun src/run-climbing-test.ts --limit 25
  bun src/run-climbing-test.ts 25
  bun src/run-climbing-test.ts --limit 25 --sqlite-path ../../hikr.sqlite
  bun src/run-climbing-test.ts --special-case

Always purges the local Postgres test DB, seeds source posts from SQLite,
then runs the climbing workflow against the seeded rows. With --special-case,
it also runs the climbing tour aggregation job afterward.`);
}

function logProgress(event: ClimbingPipelineProgressEvent): void {
  if (event.type === 'source-loaded') {
    const skipped = event.skippedTerminal > 0 ? `; skipped ${event.skippedTerminal} terminal` : '';
    console.log(
      `Loaded ${formatTotal(event.total)} source posts for extraction job ${event.extractionJobId.toString()}${skipped}.`,
    );
    return;
  }

  if (event.type === 'post-start') {
    console.log(
      `${formatProgress(event.index, event.total)} start report ${event.reportId.toString()}${formatTitle(event.title)}`,
    );
    return;
  }

  if (event.type === 'post-success') {
    const details = [
      `status=${event.status}`,
      event.activity ? `activity=${event.activity}` : null,
      event.subActivity ? `subActivity=${event.subActivity}` : null,
      event.routeName ? `route=${event.routeName}` : null,
      event.summit ? `summit=${event.summit}` : null,
      event.gardenName ? `garden=${event.gardenName}` : null,
      event.reasons.length > 0 ? `reasons=${event.reasons.join(',')}` : null,
    ].filter(Boolean);

    console.log(
      `${formatProgress(event.index, event.total)} done report ${event.reportId.toString()} in ${formatDuration(event.elapsedMs)} (${details.join('; ')})`,
    );
    return;
  }

  if (event.type === 'post-failure') {
    console.log(
      `${formatProgress(event.index, event.total)} workflow returned ${event.workflowStatus} for report ${event.reportId.toString()} after ${formatDuration(event.elapsedMs)}`,
    );
    return;
  }

  console.log(
    `${formatProgress(event.index, event.total)} error report ${event.reportId.toString()} after ${formatDuration(event.elapsedMs)}: ${formatError(event.error)}`,
  );
}

function logAggregationProgress(event: ClimbingTourAggregationProgressEvent): void {
  if (event.type === 'route-aggregated') {
    console.log(
      `Aggregated route ${event.routeId.toString()} from ${event.sourceReportCount} report(s); agent=${event.agentStatus}`,
    );
    return;
  }

  if (event.type === 'route-skipped') {
    console.log(
      `Skipped aggregation for route ${event.routeId.toString()} from ${event.sourceReportCount} report(s); reason=${event.reason}`,
    );
    return;
  }

  console.log(`Deleted ${event.count} stale aggregate row(s)`);
}

function formatDatabaseUrl(value: string | undefined): string {
  if (!value) {
    return 'DATABASE_URL missing';
  }

  return value.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
}

function formatTotal(total: number | undefined): string {
  return total === undefined ? 'unknown number of' : total.toString();
}

function formatProgress(index: number, total: number | undefined): string {
  return `[${index}/${total ?? '?'}]`;
}

function formatTitle(title: string | null): string {
  if (!title) {
    return '';
  }

  const normalized = title.replace(/\s+/g, ' ').trim();
  return normalized ? ` - ${truncate(normalized, 80)}` : '';
}

function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }

  return `${(milliseconds / 1000).toFixed(1)}s`;
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

type TestDatabasePurgeResult = {
  reportBaseRows: number;
  routeRows: number;
  summitRows: number;
  sourcePostRows: number;
  sourceWaypointRows: number;
  scraperProgressRows: number;
};

type TestDatabaseCounts = TestDatabasePurgeResult & {
  climbingGardenRows: number;
  climbingTourRows: number;
  climbingTourAggregateRows: number;
};

async function purgeTestDatabase(prisma: PrismaClient): Promise<TestDatabasePurgeResult> {
  const pipelineOutput = await purgePipelineOutput(prisma);

  const source = await prisma.$transaction(async (tx) => {
    await tx.hikrReportWaypointSchema.deleteMany();
    const sourcePosts = await tx.hikrOrgPostSchema.deleteMany();
    const sourceWaypoints = await tx.hikrWaypointSchema.deleteMany();
    const scraperProgress = await tx.hikrScraperProgressSchema.deleteMany();

    return {
      sourcePostRows: sourcePosts.count,
      sourceWaypointRows: sourceWaypoints.count,
      scraperProgressRows: scraperProgress.count,
    };
  });

  return {
    ...pipelineOutput,
    ...source,
  };
}

async function countTestDatabaseRows(prisma: PrismaClient): Promise<TestDatabaseCounts> {
  const [
    sourcePostRows,
    reportBaseRows,
    routeRows,
    summitRows,
    sourceWaypointRows,
    scraperProgressRows,
    climbingTourRows,
    climbingGardenRows,
    climbingTourAggregateRows,
  ] = await prisma.$transaction([
    prisma.hikrOrgPostSchema.count(),
    prisma.reportBaseSchema.count(),
    prisma.routeSchema.count(),
    prisma.summitSchema.count(),
    prisma.hikrWaypointSchema.count(),
    prisma.hikrScraperProgressSchema.count(),
    prisma.climbingTourBaseSchema.count(),
    prisma.climbingGardenBaseSchema.count(),
    prisma.climbingTourAggregateSchema.count(),
  ]);

  return {
    sourcePostRows,
    reportBaseRows,
    routeRows,
    summitRows,
    sourceWaypointRows,
    scraperProgressRows,
    climbingTourRows,
    climbingGardenRows,
    climbingTourAggregateRows,
  };
}

function assertRunPersistedExpectedRows({
  counts,
  processedRows,
  seededRows,
}: {
  counts: TestDatabaseCounts;
  processedRows: number;
  seededRows: number;
}): void {
  const mismatches: string[] = [];

  if (counts.sourcePostRows !== seededRows) {
    mismatches.push(`source posts ${counts.sourcePostRows} != seeded ${seededRows}`);
  }

  if (counts.reportBaseRows !== processedRows) {
    mismatches.push(
      `report_base_schema rows ${counts.reportBaseRows} != processed ${processedRows}`,
    );
  }

  if (mismatches.length === 0) {
    return;
  }

  throw new Error(
    `Post-run database state mismatch: ${mismatches.join('; ')}. ` +
      'The test runner expects source and report-base rows to remain until the next purge.',
  );
}

async function promptForLimit(): Promise<number> {
  if (!input.isTTY) {
    throw new Error('Interactive limit prompt requires a TTY. Pass --limit <number>.');
  }

  const readline = createInterface({ input, output });

  try {
    while (true) {
      const answer = await readline.question(
        `How many DB entries should the climbing test run process? [${DEFAULT_LIMIT}] `,
      );
      const trimmed = answer.trim();

      if (!trimmed) {
        return DEFAULT_LIMIT;
      }

      try {
        return parsePositiveInteger(trimmed, 'Limit');
      } catch (error) {
        console.log(error instanceof Error ? error.message : 'Invalid limit');
      }
    }
  } finally {
    readline.close();
  }
}

async function main(): Promise<void> {
  const args = parseArgs(Bun.argv.slice(2));
  const rootEnv = loadRootEnv();

  if (args.help) {
    printUsage();
    return;
  }

  const limit = args.limit ?? (args.useSpecialCaseFixture ? undefined : await promptForLimit());
  const sqlitePath = args.useSpecialCaseFixture
    ? join(rootEnv.rootDir, SPECIAL_CASE_FIXTURE_SQLITE_PATH)
    : (args.sqlitePath ?? process.env.HIKR_SQLITE_PATH ?? join(rootEnv.rootDir, 'hikr.sqlite'));

  console.log(`Using Postgres ${formatDatabaseUrl(process.env.DATABASE_URL)}`);
  console.log(`Using SQLite source ${sqlitePath}`);

  const prisma = new PrismaClient();

  try {
    console.log('Purging local Postgres test DB...');
    const purge = await purgeTestDatabase(prisma);
    console.log(
      `Purged ${purge.sourcePostRows} source posts, ${purge.reportBaseRows} report_base_schema rows, ${purge.routeRows} routes, ${purge.summitRows} summits, ${purge.sourceWaypointRows} waypoints, and ${purge.scraperProgressRows} scraper progress rows.`,
    );

    console.log(`Seeding ${limit ?? 'all'} source DB entries from ${sqlitePath}...`);
    const seed = await seedHikrReportsFromSqlite({ prisma, sqlitePath, limit });

    if (seed.insertedRows === 0) {
      throw new Error(`No source posts found in SQLite database: ${sqlitePath}`);
    }

    console.log(`Seeded ${seed.insertedRows} source posts.`);
    console.log(`Running climbing workflow for ${seed.insertedRows} DB entries...`);
    const { runDataPipelineWorkflow } = await import('./utils/workflow-runner');
    const result = await runDataPipelineWorkflow({
      workflow: 'climbing',
      database: createPostgresDatabase(prisma),
      limit: seed.insertedRows,
      onProgress: logProgress,
    });

    console.log(`\nDone. Processed ${result.total} posts`);
    console.log('Status counts:', result.statusCounts);

    if (args.useSpecialCaseFixture) {
      console.log('\nRunning climbing tour aggregation job for special-case data...');
      const { mastra } = await import('agent/mastra');
      const aggregateResult = await runClimbingTourAggregationService({
        prisma,
        summarize: createMastraClimbingTourAggregationSummarizer(
          mastra.getAgent('climbing-tour-aggregation-agent'),
        ),
        onProgress: logAggregationProgress,
      });

      console.log(
        `Aggregation done. Routes seen: ${aggregateResult.totalRoutes}; aggregated: ${aggregateResult.aggregatedRoutes}; skipped: ${aggregateResult.skippedRoutes}; stale deleted: ${aggregateResult.staleDeleted}.`,
      );
    }

    const counts = await countTestDatabaseRows(prisma);
    console.log(
      `Persisted rows: ${counts.sourcePostRows} source posts, ${counts.reportBaseRows} report_base_schema rows, ${counts.routeRows} routes, ${counts.climbingTourRows} climbing tours, ${counts.climbingGardenRows} climbing gardens, ${counts.climbingTourAggregateRows} climbing tour aggregates.`,
    );
    assertRunPersistedExpectedRows({
      counts,
      processedRows: result.total,
      seededRows: seed.insertedRows,
    });
  } finally {
    await prisma.$disconnect();
  }
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
