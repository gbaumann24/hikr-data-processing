import type { Mastra } from '@mastra/core/mastra';
import { toAsyncIterable } from '@hikr/utils';
import {
  mapReportBaseToSchemaWrite,
  type PreprocessorStatus,
} from '../../pipeline/baselayer';
import type { ClimbingDataPipelineDatabase } from '../../pipeline/climbing/pipeline';
import type { ClimbingPreprocessorOutput } from '../../pipeline/climbing';

export type ClimbingPipelineServiceOptions = {
  mastra: Mastra;
  database: ClimbingDataPipelineDatabase;
  limit?: number;
};

export type ClimbingPipelineServiceResult = {
  total: number;
  statusCounts: Record<PreprocessorStatus, number>;
};

export async function runClimbingPipelineService({
  mastra,
  database,
  limit,
}: ClimbingPipelineServiceOptions): Promise<ClimbingPipelineServiceResult> {
  const workflow = mastra.getWorkflow('climbing-pipeline');
  const source = await database.findHikrOrgPostsForClimbingPreprocessing();

  let total = 0;
  const statusCounts: Record<PreprocessorStatus, number> = {
    ready: 0,
    skipped: 0,
    insufficient: 0,
  };

  for await (const post of toAsyncIterable(source)) {
    if (limit !== undefined && total >= limit) {
      break;
    }

    const run = await workflow.createRun();
    const result = await run.start({ inputData: post });

    if (result.status === 'success') {
      const climbing = result.result as ClimbingPreprocessorOutput;
      await database.upsertReportBase(mapReportBaseToSchemaWrite(climbing.base));
      statusCounts[climbing.base.status] += 1;
    }

    total += 1;
  }

  return { total, statusCounts };
}
