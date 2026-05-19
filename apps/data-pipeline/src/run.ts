import { PrismaClient } from '@hikr/db';
import { mastra, runClimbingPipelineService } from 'agent/mastra';
import { createPostgresDatabase } from './database/postgres';

const limit = process.env.LIMIT ? Number(process.env.LIMIT) : undefined;

console.log(`Running climbing pipeline${limit ? ` — limit: ${limit}` : ''}`);

const prisma = new PrismaClient();

try {
  const result = await runClimbingPipelineService({
    mastra,
    database: createPostgresDatabase(prisma),
    limit,
  });

  console.log(`\nDone. Processed ${result.total} posts`);
  console.log('Status counts:', result.statusCounts);
} finally {
  await prisma.$disconnect();
}
