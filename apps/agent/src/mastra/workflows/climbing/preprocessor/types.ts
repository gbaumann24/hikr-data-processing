import type {
  ClimbingGardenBasePreprocessorOutput,
  ClimbingTourBasePreprocessorOutput,
} from '@hikr/shared';
import { CLIMBING_PREPROCESSOR_SCHEMA_VERSION, CLIMBING_SUB_ACTIVITY } from '@hikr/shared';
import type { BaseLayerPreprocessorReason, ReportBasePreprocessorOutput } from '../../baselayer';

export { CLIMBING_PREPROCESSOR_SCHEMA_VERSION, CLIMBING_SUB_ACTIVITY };
export type { ClimbingGardenBasePreprocessorOutput, ClimbingTourBasePreprocessorOutput };

export type ClimbingPreprocessorAgentInput = {
  title: string;
  description: string;
  canton: string;
};

export const climbingPreprocessorAgentOutputSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['subActivity', 'routeName', 'summit', 'name'],
  properties: {
    subActivity: {
      enum: [CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR, CLIMBING_SUB_ACTIVITY.CLIMBING_GARDEN, null],
    },
    routeName: { type: ['string', 'null'], minLength: 1 },
    summit: { type: ['string', 'null'], minLength: 1 },
    name: { type: ['string', 'null'], minLength: 1 },
  },
} as const;

export type ClimbingPreprocessorAgentStructuredOutput = {
  subActivity:
    | typeof CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR
    | typeof CLIMBING_SUB_ACTIVITY.CLIMBING_GARDEN
    | null;
  routeName: string | null;
  summit: string | null;
  name: string | null;
};

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

export function parseClimbingPreprocessorAgentOutput(
  output: unknown,
): ClimbingPreprocessorAgentOutput {
  if (!isClimbingPreprocessorAgentStructuredOutput(output)) {
    return { subActivity: null };
  }

  if (output.subActivity === null) {
    return { subActivity: null };
  }

  if (output.subActivity === CLIMBING_SUB_ACTIVITY.CLIMBING_GARDEN) {
    const name = normalizeOptionalString(output.name);

    if (!name) {
      return { subActivity: null };
    }

    return {
      subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_GARDEN,
      name,
    };
  }

  const routeName = normalizeOptionalString(output.routeName);
  const summit = normalizeOptionalString(output.summit);

  if (!routeName || !summit) {
    return { subActivity: null };
  }

  return {
    subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR,
    routeName,
    summit,
  };
}

function isClimbingPreprocessorAgentStructuredOutput(
  output: unknown,
): output is ClimbingPreprocessorAgentStructuredOutput {
  if (typeof output !== 'object' || output === null) {
    return false;
  }

  const candidate = output as Partial<ClimbingPreprocessorAgentStructuredOutput>;

  return (
    (candidate.subActivity === CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR ||
      candidate.subActivity === CLIMBING_SUB_ACTIVITY.CLIMBING_GARDEN ||
      candidate.subActivity === null) &&
    isNullableString(candidate.routeName) &&
    isNullableString(candidate.summit) &&
    isNullableString(candidate.name)
  );
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function normalizeOptionalString(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized === '' ? null : normalized;
}

export type ClimbingPreprocessorAgentRunner = (
  input: ClimbingPreprocessorAgentInput,
) => Promise<ClimbingPreprocessorAgentOutput>;

export type ClimbingPreprocessorReason =
  | BaseLayerPreprocessorReason
  | 'unsupported_activity_scales'
  | 'unsupported_activity_combination'
  | 'non_climbing_activity'
  | 'missing_climbing_preprocessor_agent'
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
