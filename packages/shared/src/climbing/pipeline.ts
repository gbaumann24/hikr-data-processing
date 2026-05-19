import type { MaybePromise } from '@hikr/types';
import type { BaseLayerDataPipelineDatabase } from '../baselayer';
import type {
  ClimbingGardenBasePreprocessorOutput,
  ClimbingTourBasePreprocessorOutput,
  RouteCragNamesLookupInput,
  RouteNamesLookupInput,
  RouteSummitNamesLookupInput,
} from './db';

export type ClimbingDataPipelineDatabase = BaseLayerDataPipelineDatabase & {
  findRouteSummitNames: (input: RouteSummitNamesLookupInput) => MaybePromise<string[]>;
  findRouteNames: (input: RouteNamesLookupInput) => MaybePromise<string[]>;
  findRouteCragNames: (input: RouteCragNamesLookupInput) => MaybePromise<string[]>;
  upsertClimbingTourBase: (input: ClimbingTourBasePreprocessorOutput) => MaybePromise<void>;
  upsertClimbingGardenBase: (input: ClimbingGardenBasePreprocessorOutput) => MaybePromise<void>;
};
