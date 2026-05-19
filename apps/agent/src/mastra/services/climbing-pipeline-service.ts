import type { Mastra } from '@mastra/core/mastra';
import { toAsyncIterable } from '@hikr/utils';
import {
  mapReportBaseToSchemaWrite,
  type PreprocessorStatus,
} from '../workflows/baselayer';
import type { ClimbingDataPipelineDatabase, ClimbingPreprocessorOutput } from '../workflows/climbing';
import { PREPROCESSOR_STATUS } from '../workflows/baselayer';

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
  const source = await database.findHikrOrgPostsForPreprocessing();

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

      if (climbing.base.status === PREPROCESSOR_STATUS.READY) {
        if (climbing.climbingTourBase) {
          await database.upsertClimbingTourBase(climbing.climbingTourBase);
        }
        if (climbing.climbingGardenBase) {
          await database.upsertClimbingGardenBase(climbing.climbingGardenBase);
        }
      }

      statusCounts[climbing.base.status] += 1;
    }

    total += 1;
  }

  return { total, statusCounts };
}
