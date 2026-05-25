import type { Mastra } from '@mastra/core/mastra';
import { toAsyncIterable } from '@hikr/utils';
import type { BaseLayerDataPipelineDatabase } from '@hikr/shared';
import {
  mapReportBaseToSchemaWrite,
  type BaseLayerGateOutput,
  type PreprocessorStatus,
} from '../workflows/baselayer';

export type BaseLayerPipelineServiceOptions = {
  mastra: Mastra;
  database: BaseLayerDataPipelineDatabase;
  limit?: number;
};

export type BaseLayerPipelineServiceResult = {
  total: number;
  statusCounts: Record<PreprocessorStatus, number>;
};

export async function runBaseLayerPipelineService({
  mastra,
  database,
  limit,
}: BaseLayerPipelineServiceOptions): Promise<BaseLayerPipelineServiceResult> {
  const workflow = mastra.getWorkflow('baselayer');
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
      const baseLayer = result.result as BaseLayerGateOutput;
      await database.upsertReportBase(
        mapReportBaseToSchemaWrite(baseLayer.base, baseLayer.reasons),
      );
      statusCounts[baseLayer.base.status] += 1;
    }

    total += 1;
  }

  return { total, statusCounts };
}
