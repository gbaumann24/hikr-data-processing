import type { MaybePromise } from '@hikr/types';
import type { BaseLayerDataPipelineDatabase } from '../baselayer';
import type {
  ClimbingGardenBasePreprocessorOutput,
  ClimbingTourDetailsSchemaWriteInput,
  ClimbingTourBasePreprocessorOutput,
  RouteCragNamesLookupInput,
  RouteNamesLookupInput,
  RouteNamesLookupOutput,
  RouteSummitNamesLookupInput,
} from './db';

export type ClimbingDataPipelineDatabase = BaseLayerDataPipelineDatabase & {
  findRouteSummitNames: (input: RouteSummitNamesLookupInput) => MaybePromise<string[]>;
  findRouteNames: (input: RouteNamesLookupInput) => MaybePromise<RouteNamesLookupOutput[]>;
  findRouteCragNames: (input: RouteCragNamesLookupInput) => MaybePromise<string[]>;
  upsertClimbingTourBase: (input: ClimbingTourBasePreprocessorOutput) => MaybePromise<void>;
  upsertClimbingGardenBase: (input: ClimbingGardenBasePreprocessorOutput) => MaybePromise<void>;
  upsertClimbingTourDetails: (input: ClimbingTourDetailsSchemaWriteInput) => MaybePromise<void>;
  updateSummitHeightIfMissing: (input: {
    canton: string;
    summitName: string;
    heightMeters: number;
  }) => MaybePromise<void>;
};
