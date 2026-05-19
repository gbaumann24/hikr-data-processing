import type {
  ClimbingGardenBaseSchema,
  ClimbingTourBaseSchema,
  Prisma,
  ReportBaseSchema,
} from '@hikr/db';
import type { CLIMBING_PREPROCESSOR_SCHEMA_VERSION } from './domain';

export const HIKR_ORG_POST_BASE_LAYER_SELECT = {
  id: true,
  title: true,
  regionPathCsv: true,
  tourDate: true,
  hikingDifficulty: true,
  alpineTourDifficulty: true,
  climbingDifficulty: true,
  snowshoeTourDifficulty: true,
  viaFerrataDifficulty: true,
  skiDifficulty: true,
  iceClimbingDifficulty: true,
  mountainBikeDifficulty: true,
  description: true,
} satisfies Prisma.HikrOrgPostSchemaSelect;

export type HikrOrgPostBaseLayerInput = Prisma.HikrOrgPostSchemaGetPayload<{
  select: typeof HIKR_ORG_POST_BASE_LAYER_SELECT;
}>;

export type ReportBaseSchemaWriteInput = Pick<
  ReportBaseSchema,
  'reportId' | 'status' | 'activity' | 'subActivity' | 'canton' | 'tourDate' | 'region'
>;

export type ClimbingTourBaseSchemaWriteInput = Pick<
  ClimbingTourBaseSchema,
  'reportId' | 'schemaVersion' | 'routeName' | 'summit'
>;

export type ClimbingGardenBaseSchemaWriteInput = Pick<
  ClimbingGardenBaseSchema,
  'reportId' | 'name'
>;

export type ClimbingTourBasePreprocessorOutput = Omit<
  ClimbingTourBaseSchemaWriteInput,
  'schemaVersion'
> & {
  schemaVersion: typeof CLIMBING_PREPROCESSOR_SCHEMA_VERSION;
};

export type ClimbingGardenBasePreprocessorOutput = ClimbingGardenBaseSchemaWriteInput;
