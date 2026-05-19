import type {
  ClimbingGardenBasePreprocessorOutput,
  ClimbingTourBasePreprocessorOutput,
} from '@hikr/shared';
import {
  CLIMBING_PREPROCESSOR_SCHEMA_VERSION,
  CLIMBING_SUB_ACTIVITY,
} from '@hikr/shared';
import type {
  BaseLayerPreprocessorReason,
  ReportBasePreprocessorOutput,
} from '../../baselayer';

export { CLIMBING_PREPROCESSOR_SCHEMA_VERSION, CLIMBING_SUB_ACTIVITY };
export type {
  ClimbingGardenBasePreprocessorOutput,
  ClimbingTourBasePreprocessorOutput,
};

export type ClimbingPreprocessorAgentInput = {
  title: string;
  description: string;
  canton: string;
};

export const climbingPreprocessorAgentOutputSchema = {
  type: 'object',
  oneOf: [
    {
      type: 'object',
      additionalProperties: false,
      required: ['subActivity', 'routeName', 'summit'],
      properties: {
        subActivity: { enum: [CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR] },
        routeName: { type: 'string', minLength: 1 },
        summit: { type: 'string', minLength: 1 },
      },
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['subActivity', 'name'],
      properties: {
        subActivity: { enum: [CLIMBING_SUB_ACTIVITY.CLIMBING_GARDEN] },
        name: { type: 'string', minLength: 1 },
      },
    },
    {
      type: 'object',
      additionalProperties: false,
      required: ['subActivity'],
      properties: {
        subActivity: { type: 'null' },
      },
    },
  ],
} as const;

export type ClimbingPreprocessorAgentOutput =
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
    };

export type ClimbingPreprocessorAgentRunner = (
  input: ClimbingPreprocessorAgentInput,
) => Promise<ClimbingPreprocessorAgentOutput | null>;

export type ClimbingPreprocessorReason =
  | BaseLayerPreprocessorReason
  | 'unsupported_activity_scales'
  | 'unsupported_activity_combination'
  | 'non_climbing_activity'
  | 'missing_climbing_preprocessor_agent'
  | 'invalid_climbing_preprocessor_agent_output'
  | 'no_climbing_preprocessor_agent_match'
  | 'ready';

export type ClimbingPreprocessorOutput = {
  base: ReportBasePreprocessorOutput;
  climbingTourBase: ClimbingTourBasePreprocessorOutput | null;
  climbingGardenBase: ClimbingGardenBasePreprocessorOutput | null;
  normalizedDescription: string;
  normalizedDescriptionLength: number;
  reasons: ClimbingPreprocessorReason[];
};
