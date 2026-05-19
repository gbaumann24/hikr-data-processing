import {
  mapHikrOrgPostToPreprocessorInput,
  mapReportBaseToSchemaWrite,
  prepareBaseLayer,
  PREPROCESSOR_STATUS,
  type BaseLayerPreprocessorOutput,
  type HikrOrgPostBaseLayerInput,
  type HikrPreprocessorInput,
  type PreprocessorStatus,
  type ReportBaseSchemaWriteInput,
} from '../../baselayer';
import { toAsyncIterable } from '@hikr/utils';
import { preprocessPreparedBaseLayerForClimbing } from './preprocessor';
import { createStatusCounts } from './utils';
import type { BaseDataPipelineDatabase, MaybePromise } from '@hikr/db';
import type {
  ClimbingGardenBasePreprocessorOutput,
  ClimbingPreprocessorOutput,
  ClimbingSubActivityClassifier,
  ClimbingTourBasePreprocessorOutput,
} from './types';

export type ClimbingDataPipelineDatabase = BaseDataPipelineDatabase<
  HikrOrgPostBaseLayerInput,
  ReportBaseSchemaWriteInput
> & {
  upsertClimbingTourBase: (input: ClimbingTourBasePreprocessorOutput) => MaybePromise<void>;
  upsertClimbingGardenBase: (input: ClimbingGardenBasePreprocessorOutput) => MaybePromise<void>;
};

export type RunClimbingDataPipelineOptions = {
  database: ClimbingDataPipelineDatabase;
  classifySubActivity?: ClimbingSubActivityClassifier | null;
  limit?: number;
};

export type ClimbingDataPipelineItem = {
  hikrOrgPost: HikrOrgPostBaseLayerInput;
  input: HikrPreprocessorInput;
  baseLayer: BaseLayerPreprocessorOutput;
  climbing: ClimbingPreprocessorOutput;
};

export type ClimbingDataPipelineResult = {
  items: ClimbingDataPipelineItem[];
  total: number;
  statusCounts: Record<PreprocessorStatus, number>;
};

export async function runClimbingDataPipeline({
  database,
  classifySubActivity,
  limit,
}: RunClimbingDataPipelineOptions): Promise<ClimbingDataPipelineResult> {
  const source = await database.findHikrOrgPostsForClimbingPreprocessing();
  const items: ClimbingDataPipelineItem[] = [];
  const statusCounts = createStatusCounts();

  for await (const hikrOrgPost of toAsyncIterable(source)) {
    if (limit !== undefined && items.length >= limit) {
      break;
    }

    const input = mapHikrOrgPostToPreprocessorInput(hikrOrgPost);
    const baseLayer = prepareBaseLayer(input);

    const climbing = await preprocessPreparedBaseLayerForClimbing(input, baseLayer, {
      classifySubActivity: classifySubActivity ?? undefined,
    });

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
    items.push({ hikrOrgPost, input, baseLayer, climbing });
  }

  return {
    items,
    total: items.length,
    statusCounts,
  };
}
