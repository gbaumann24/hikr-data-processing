import { Database } from 'bun:sqlite';
import { mastra, runClimbingPipelineService } from 'agent/mastra';
import { createSqliteDatabase } from './database/sqlite';

const sqlitePath = process.env.HIKR_SQLITE_PATH;

if (!sqlitePath) {
  throw new Error('HIKR_SQLITE_PATH env variable is required');
}

const db = new Database(sqlitePath, { readonly: true });

try {
  const result = await runClimbingPipelineService({
    mastra,
    database: createSqliteDatabase(db),
  });

  console.log(`Processed ${result.total} posts`);
  console.log('Status counts:', result.statusCounts);
} finally {
  db.close();
}
