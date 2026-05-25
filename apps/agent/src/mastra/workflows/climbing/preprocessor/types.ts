import type {
  ClimbingGardenBasePreprocessorOutput,
  ClimbingTourBasePreprocessorOutput,
  HikrDifficultyScale,
} from '@hikr/shared';
import {
  ACTIVITY,
  CLIMBING_PREPROCESSOR_SCHEMA_VERSION,
  CLIMBING_SUB_ACTIVITY,
} from '@hikr/shared';
import type { BaseLayerPreprocessorReason, ReportBasePreprocessorOutput } from '../../baselayer';

export { CLIMBING_PREPROCESSOR_SCHEMA_VERSION, CLIMBING_SUB_ACTIVITY };
export type { ClimbingGardenBasePreprocessorOutput, ClimbingTourBasePreprocessorOutput };

export type ClimbingPreprocessorAgentInput = {
  title: string;
  description: string;
  canton: string;
  difficultyScales: Array<{ scale: HikrDifficultyScale; value: string }>;
};

export const climbingPreprocessorAgentOutputSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['activity', 'subActivity', 'routeName', 'routeNames', 'summit', 'name'],
  properties: {
    activity: {
      enum: [ACTIVITY.CLIMBING, ACTIVITY.HIKING],
    },
    subActivity: {
      enum: [CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR, CLIMBING_SUB_ACTIVITY.CLIMBING_GARDEN, null],
    },
    routeName: { type: ['string', 'null'], minLength: 1 },
    routeNames: {
      type: ['array', 'null'],
      items: { type: 'string', minLength: 1 },
    },
    summit: { type: ['string', 'null'], minLength: 1 },
    name: { type: ['string', 'null'], minLength: 1 },
  },
} as const;

export type ClimbingPreprocessorAgentActivity = typeof ACTIVITY.CLIMBING | typeof ACTIVITY.HIKING;

export type ClimbingPreprocessorAgentStructuredOutput = {
  activity: ClimbingPreprocessorAgentActivity;
  subActivity:
    | typeof CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR
    | typeof CLIMBING_SUB_ACTIVITY.CLIMBING_GARDEN
    | null;
  routeName: string | null;
  routeNames: string[] | null;
  summit: string | null;
  name: string | null;
};

export type ClimbingPreprocessorAgentOutput =
  | {
      activity: typeof ACTIVITY.CLIMBING;
      subActivity: typeof CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR;
      routeName: string;
      routeNames: string[];
      summit: string;
    }
  | {
      activity: typeof ACTIVITY.CLIMBING;
      subActivity: typeof CLIMBING_SUB_ACTIVITY.CLIMBING_GARDEN;
      name: string;
    }
  | {
      activity: ClimbingPreprocessorAgentActivity;
      subActivity: null;
    };

export function parseClimbingPreprocessorAgentOutput(
  output: unknown,
): ClimbingPreprocessorAgentOutput {
  if (!isClimbingPreprocessorAgentStructuredOutput(output)) {
    return { activity: ACTIVITY.CLIMBING, subActivity: null };
  }

  if (output.activity === ACTIVITY.HIKING) {
    return { activity: ACTIVITY.HIKING, subActivity: null };
  }

  if (output.subActivity === null) {
    return { activity: ACTIVITY.CLIMBING, subActivity: null };
  }

  if (output.subActivity === CLIMBING_SUB_ACTIVITY.CLIMBING_GARDEN) {
    const name = normalizeOptionalString(output.name);

    if (!name) {
      return { activity: ACTIVITY.CLIMBING, subActivity: null };
    }

    return {
      activity: ACTIVITY.CLIMBING,
      subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_GARDEN,
      name,
    };
  }

  const routeName = normalizeOptionalString(output.routeName);
  const routeNames = normalizeRouteNames(output.routeNames, routeName);
  const summit = normalizeOptionalString(output.summit);

  if (!routeName || !summit || routeNames.length === 0) {
    return { activity: ACTIVITY.CLIMBING, subActivity: null };
  }

  return {
    activity: ACTIVITY.CLIMBING,
    subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR,
    routeName,
    routeNames,
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
    (candidate.activity === ACTIVITY.CLIMBING || candidate.activity === ACTIVITY.HIKING) &&
    (candidate.subActivity === CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR ||
      candidate.subActivity === CLIMBING_SUB_ACTIVITY.CLIMBING_GARDEN ||
      candidate.subActivity === null) &&
    isNullableString(candidate.routeName) &&
    isNullableStringArray(candidate.routeNames) &&
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

function isNullableStringArray(value: unknown): value is string[] | null {
  return (
    value === null || (Array.isArray(value) && value.every((item) => typeof item === 'string'))
  );
}

function normalizeRouteNames(value: string[] | null, routeName: string | null): string[] {
  return [
    ...new Set(
      [routeName, ...(value ?? [])]
        .map((name) => (name ? name.replace(/\s+/g, ' ').trim() : ''))
        .filter(Boolean),
    ),
  ];
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
  skipReason: string | null;
};
