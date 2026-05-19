import type { MaybePromise, MaybeAsyncIterable } from '@hikr/types';
import type { HikrOrgPostBaseLayerInput, ReportBaseSchemaWriteInput } from './db';

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
