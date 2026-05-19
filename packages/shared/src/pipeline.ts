import type { MaybePromise, MaybeAsyncIterable } from '@hikr/types';
import type {
  ClimbingGardenBasePreprocessorOutput,
  ClimbingTourBasePreprocessorOutput,
  HikrOrgPostBaseLayerInput,
  ReportBaseSchemaWriteInput,
  RouteNamesLookupInput,
  RouteSummitNamesLookupInput,
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
  findRouteSummitNames: (input: RouteSummitNamesLookupInput) => MaybePromise<string[]>;
  findRouteNames: (input: RouteNamesLookupInput) => MaybePromise<string[]>;
  upsertClimbingTourBase: (input: ClimbingTourBasePreprocessorOutput) => MaybePromise<void>;
  upsertClimbingGardenBase: (input: ClimbingGardenBasePreprocessorOutput) => MaybePromise<void>;
};
