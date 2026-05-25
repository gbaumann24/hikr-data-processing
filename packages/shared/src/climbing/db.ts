import type { ClimbingGardenBaseSchema, ClimbingTourBaseSchema, RouteSchema } from '@hikr/db';
import type { CLIMBING_PREPROCESSOR_SCHEMA_VERSION } from './domain';

export type ClimbingTourBaseSchemaWriteInput = Pick<
  ClimbingTourBaseSchema,
  'reportId' | 'schemaVersion' | 'routeId'
>;

export type RouteSchemaWriteInput = Pick<
  RouteSchema,
  | 'activity'
  | 'subActivity'
  | 'routeName'
  | 'routeNames'
  | 'startPoint'
  | 'summitId'
  | 'cragName'
  | 'canton'
>;

export type RouteSummitNamesLookupInput = Pick<RouteSchemaWriteInput, 'activity' | 'canton'> & {
  subActivity: string;
};

export type RouteNamesLookupInput = Pick<RouteSchemaWriteInput, 'activity' | 'canton'> & {
  subActivity: string;
  summitName: string;
};

export type RouteNamesLookupOutput = {
  routeName: string;
  routeNames: string[];
};

export type RouteCragNamesLookupInput = Pick<RouteSchemaWriteInput, 'activity' | 'canton'> & {
  subActivity: string;
};

export type ClimbingGardenBaseSchemaWriteInput = Pick<
  ClimbingGardenBaseSchema,
  'reportId' | 'name'
>;

export type ClimbingTourBasePreprocessorOutput = Pick<ClimbingTourBaseSchema, 'reportId'> & {
  schemaVersion: typeof CLIMBING_PREPROCESSOR_SCHEMA_VERSION;
  routeName: string;
  routeNames: string[];
  summit: string;
};

export type ClimbingGardenBasePreprocessorOutput = ClimbingGardenBaseSchemaWriteInput;
