import type { MaybePromise, MaybeAsyncIterable } from '@hikr/types';
import type {
  ClimbingGardenBasePreprocessorOutput,
  ClimbingTourBasePreprocessorOutput,
  HikrOrgPostBaseLayerInput,
  ReportBaseSchemaWriteInput,
} from './db';

export type HikrOrgPostPreprocessingSource<SourceRow> = {
  findHikrOrgPostsForPreprocessing: () => MaybePromise<MaybeAsyncIterable<SourceRow>>;
};

export type BaseLayerDataPipelineDatabase = HikrOrgPostPreprocessingSource<
  HikrOrgPostBaseLayerInput
> & {
  upsertReportBase: (input: ReportBaseSchemaWriteInput) => MaybePromise<void>;
};

export type BaseDataPipelineDatabase<SourceRow, ReportBaseWriteInput> = HikrOrgPostPreprocessingSource<
  SourceRow
> & {
  upsertReportBase: (input: ReportBaseWriteInput) => MaybePromise<void>;
};

export type ClimbingDataPipelineDatabase = BaseLayerDataPipelineDatabase & {
  upsertClimbingTourBase: (input: ClimbingTourBasePreprocessorOutput) => MaybePromise<void>;
  upsertClimbingGardenBase: (input: ClimbingGardenBasePreprocessorOutput) => MaybePromise<void>;
};
