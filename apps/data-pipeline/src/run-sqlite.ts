import { Database } from 'bun:sqlite';
import { mastra, runClimbingPipelineService } from 'agent/mastra';
import { createSqliteDatabase } from './database/sqlite';

const sqlitePath = process.env.HIKR_SQLITE_PATH;
const limit = process.env.LIMIT ? Number(process.env.LIMIT) : undefined;

if (!sqlitePath) {
  throw new Error('HIKR_SQLITE_PATH env variable is required');
}

console.log(`Running climbing pipeline (SQLite) — ${sqlitePath}${limit ? `, limit: ${limit}` : ''}`);

const db = new Database(sqlitePath, { readonly: true });

try {
  const result = await runClimbingPipelineService({
    mastra,
    database: createSqliteDatabase(db),
    limit,
  });

  console.log(`\nDone. Processed ${result.total} posts`);
  console.log('Status counts:', result.statusCounts);
} finally {
  db.close();
}
