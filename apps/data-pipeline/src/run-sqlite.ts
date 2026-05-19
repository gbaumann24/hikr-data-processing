import { Database } from 'bun:sqlite';
import { createSqliteDatabase } from './database/sqlite';
import {
  formatDataPipelineWorkflow,
  getDataPipelineWorkflow,
  runDataPipelineWorkflow,
} from './utils/workflow-runner';

const sqlitePath = process.env.HIKR_SQLITE_PATH;
const limit = process.env.LIMIT ? Number(process.env.LIMIT) : undefined;
const workflow = getDataPipelineWorkflow();

if (!sqlitePath) {
  throw new Error('HIKR_SQLITE_PATH env variable is required');
}

console.log(
  `Running ${formatDataPipelineWorkflow(workflow)} (SQLite) - ${sqlitePath}${limit ? `, limit: ${limit}` : ''}`,
);

const db = new Database(sqlitePath, { readonly: true });

try {
  const result = await runDataPipelineWorkflow({
    workflow,
    database: createSqliteDatabase(db),
    limit,
  });

  console.log(`\nDone. Processed ${result.total} posts`);
  console.log('Status counts:', result.statusCounts);
} finally {
  db.close();
}
