import type { MaybePromise, MaybeAsyncIterable } from '@hikr/types';
import type {
  ClimbingGardenBasePreprocessorOutput,
  ClimbingTourBasePreprocessorOutput,
  HikrOrgPostBaseLayerInput,
  ReportBaseSchemaWriteInput,
} from './db';

export type BaseDataPipelineDatabase<SourceRow, ReportBaseWriteInput> = {
  findHikrOrgPostsForClimbingPreprocessing: () => MaybePromise<MaybeAsyncIterable<SourceRow>>;
  upsertReportBase: (input: ReportBaseWriteInput) => MaybePromise<void>;
};

export type ClimbingDataPipelineDatabase = BaseDataPipelineDatabase<
  HikrOrgPostBaseLayerInput,
  ReportBaseSchemaWriteInput
> & {
  upsertClimbingTourBase: (input: ClimbingTourBasePreprocessorOutput) => MaybePromise<void>;
  upsertClimbingGardenBase: (input: ClimbingGardenBasePreprocessorOutput) => MaybePromise<void>;
};
