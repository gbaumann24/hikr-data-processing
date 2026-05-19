import type {
  BaseLayerPreprocessorReason,
  ReportBasePreprocessorOutput,
} from '../../baselayer';

export const CLIMBING_PREPROCESSOR_SCHEMA_VERSION = 'climbing-preprocessor-v1';

export const CLIMBING_SUB_ACTIVITY = {
  CLIMBING_TOUR: 'Klettertour',
  CLIMBING_GARDEN: 'Klettergarten',
} as const;

export type ClimbingSubActivity =
  (typeof CLIMBING_SUB_ACTIVITY)[keyof typeof CLIMBING_SUB_ACTIVITY];

export type ClimbingSubActivityClassifierInput = {
  title: string;
  description: string;
};

export const climbingSubActivityClassificationSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['subActivity', 'routeName', 'summit', 'name', 'reason'],
  properties: {
    subActivity: {
      enum: [
        CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR,
        CLIMBING_SUB_ACTIVITY.CLIMBING_GARDEN,
        null,
      ],
    },
    routeName: { type: ['string', 'null'] },
    summit: { type: ['string', 'null'] },
    name: { type: ['string', 'null'] },
    reason: { type: ['string', 'null'] },
  },
} as const;

export type ClimbingSubActivityClassification =
  | {
      subActivity: typeof CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR;
      routeName: string;
      summit: string;
    }
  | {
      subActivity: typeof CLIMBING_SUB_ACTIVITY.CLIMBING_GARDEN;
      name: string;
    }
  | {
      subActivity: null;
      reason?: string;
    };

export type ClimbingSubActivityClassifier = (
  input: ClimbingSubActivityClassifierInput,
) => Promise<unknown>;

export type ClimbingTourBasePreprocessorOutput = {
  reportId: bigint;
  schemaVersion: typeof CLIMBING_PREPROCESSOR_SCHEMA_VERSION;
  routeName: string;
  summit: string;
};

export type ClimbingGardenBasePreprocessorOutput = {
  reportId: bigint;
  name: string;
};

export type ClimbingPreprocessorReason =
  | BaseLayerPreprocessorReason
  | 'unsupported_activity_scales'
  | 'unsupported_activity_combination'
  | 'non_climbing_activity'
  | 'missing_sub_activity_classifier'
  | 'invalid_sub_activity_classification'
  | 'no_climbing_sub_activity'
  | 'ready';

export type ClimbingPreprocessorOutput = {
  base: ReportBasePreprocessorOutput;
  climbingTourBase: ClimbingTourBasePreprocessorOutput | null;
  climbingGardenBase: ClimbingGardenBasePreprocessorOutput | null;
  normalizedDescription: string;
  normalizedDescriptionLength: number;
  reasons: ClimbingPreprocessorReason[];
};
