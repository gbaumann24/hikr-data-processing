import type {
  ClimbingGardenBaseSchema,
  ClimbingTourBaseSchema,
  ReportBaseSchema,
  RouteSchema,
} from '../../generated/client';

export type ReportBaseSchemaWriteInput = Pick<
  ReportBaseSchema,
  'reportId' | 'status' | 'activity' | 'subActivity' | 'canton' | 'tourDate' | 'region' | 'reasons'
>;

export type RouteSchemaWriteInput = Pick<
  RouteSchema,
  | 'activity'
  | 'subActivity'
  | 'routeName'
  | 'routeNames'
  | 'startPoint'
  | 'summitName'
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

export type RouteCragNamesLookupInput = Pick<RouteSchemaWriteInput, 'activity' | 'canton'> & {
  subActivity: string;
};

export type ClimbingTourBasePreprocessorOutput = Pick<
  ClimbingTourBaseSchema,
  'reportId' | 'schemaVersion'
> & {
  routeName: string;
  routeNames: string[];
  summit: string;
};

export type ClimbingGardenBasePreprocessorOutput = Pick<
  ClimbingGardenBaseSchema,
  'reportId' | 'name'
>;
