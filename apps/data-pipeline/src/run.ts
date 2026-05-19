import { PrismaClient } from '@hikr/db';
import { createPostgresDatabase } from './database/postgres';
import {
  formatDataPipelineWorkflow,
  getDataPipelineWorkflow,
  runDataPipelineWorkflow,
} from './utils/workflow-runner';

const limit = process.env.LIMIT ? Number(process.env.LIMIT) : undefined;
const workflow = getDataPipelineWorkflow();

console.log(`Running ${formatDataPipelineWorkflow(workflow)}${limit ? ` - limit: ${limit}` : ''}`);

const prisma = new PrismaClient();

try {
  const result = await runDataPipelineWorkflow({
    workflow,
    database: createPostgresDatabase(prisma),
    limit,
  });

  console.log(`\nDone. Processed ${result.total} posts`);
  console.log('Status counts:', result.statusCounts);
} finally {
  await prisma.$disconnect();
}
