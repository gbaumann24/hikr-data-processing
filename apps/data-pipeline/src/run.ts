import { PrismaClient } from '@hikr/db';
import { createPostgresDatabase } from './database/postgres';
import {
  formatDataPipelineWorkflow,
  getDataPipelineWorkflow,
  runDataPipelineWorkflow,
} from './utils/workflow-runner';

const limit = process.env.LIMIT ? Number(process.env.LIMIT) : undefined;
const workflow = getDataPipelineWorkflow();
const extractionJobId = process.env.EXTRACTION_JOB_ID
  ? parsePositiveBigInt(process.env.EXTRACTION_JOB_ID, 'EXTRACTION_JOB_ID')
  : undefined;
const continueOnError = !isEnabled(process.env.FAIL_FAST);

if (workflow === 'baselayer' && extractionJobId !== undefined) {
  throw new Error('EXTRACTION_JOB_ID is only supported for the climbing extraction workflow');
}

console.log(
  [
    `Running ${formatDataPipelineWorkflow(workflow)}`,
    limit ? `limit: ${limit}` : null,
    extractionJobId ? `resume extraction job: ${extractionJobId.toString()}` : null,
    continueOnError ? 'continue on per-report errors' : 'fail fast',
  ]
    .filter(Boolean)
    .join(' - '),
);

const prisma = new PrismaClient();

try {
  const result = await runDataPipelineWorkflow({
    workflow,
    database: createPostgresDatabase(prisma),
    limit,
    extractionJobId,
    continueOnError,
  });

  console.log(`\nDone. Processed ${result.total} posts`);
  console.log('Status counts:', result.statusCounts);
  if (isExtractionJobResult(result)) {
    console.log(`Extraction job: ${result.extractionJobId.toString()}`);
    console.log(`Succeeded: ${result.succeeded}; failed: ${result.failed}`);
  }
} finally {
  await prisma.$disconnect();
}

// Parses optional positive bigint environment variables used for resume ids.
function parsePositiveBigInt(value: string, label: string): bigint {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new Error(`${label} must be a positive whole number`);
  }

  return BigInt(value);
}

// Interprets common truthy environment flag values.
function isEnabled(value: string | undefined): boolean {
  return value === '1' || value?.toLowerCase() === 'true' || value?.toLowerCase() === 'yes';
}

// Narrows generic workflow results to the climbing extraction result shape.
function isExtractionJobResult(
  result: unknown,
): result is { extractionJobId: bigint; succeeded: number; failed: number } {
  return (
    typeof result === 'object' &&
    result !== null &&
    'extractionJobId' in result &&
    typeof result.extractionJobId === 'bigint' &&
    'succeeded' in result &&
    typeof result.succeeded === 'number' &&
    'failed' in result &&
    typeof result.failed === 'number'
  );
}
