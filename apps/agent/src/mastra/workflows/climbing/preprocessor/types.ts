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
import { z } from 'zod';
import type { BaseLayerPreprocessorReason, ReportBasePreprocessorOutput } from '../../baselayer';

export { CLIMBING_PREPROCESSOR_SCHEMA_VERSION, CLIMBING_SUB_ACTIVITY };
export type { ClimbingGardenBasePreprocessorOutput, ClimbingTourBasePreprocessorOutput };

export type ClimbingPreprocessorAgentInput = {
  title: string;
  description: string;
  canton: string;
  difficultyScales: Array<{ scale: HikrDifficultyScale; value: string }>;
  hikrWaypointNames: string[];
};

const climbingPreprocessorNullableStringSchema = z.string().min(1).nullable();

export const climbingPreprocessorAgentOutputSchema = z
  .object({
    activity: z.union([z.literal(ACTIVITY.CLIMBING), z.literal(ACTIVITY.HIKING)]),
    subActivity: z
      .union([
        z.literal(CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR),
        z.literal(CLIMBING_SUB_ACTIVITY.CLIMBING_GARDEN),
      ])
      .nullable(),
    routeName: climbingPreprocessorNullableStringSchema,
    routeNames: z.array(z.string().min(1)).nullable(),
    summit: climbingPreprocessorNullableStringSchema,
    name: climbingPreprocessorNullableStringSchema,
  })
  .strict();

export type ClimbingPreprocessorAgentActivity = typeof ACTIVITY.CLIMBING | typeof ACTIVITY.HIKING;

export type ClimbingPreprocessorAgentStructuredOutput = z.infer<
  typeof climbingPreprocessorAgentOutputSchema
>;

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
  const parsedOutput = climbingPreprocessorAgentOutputSchema.safeParse(output);

  if (!parsedOutput.success) {
    return { activity: ACTIVITY.CLIMBING, subActivity: null };
  }

  const structuredOutput = parsedOutput.data;

  if (structuredOutput.activity === ACTIVITY.HIKING) {
    return { activity: ACTIVITY.HIKING, subActivity: null };
  }

  if (structuredOutput.subActivity === null) {
    return { activity: ACTIVITY.CLIMBING, subActivity: null };
  }

  if (structuredOutput.subActivity === CLIMBING_SUB_ACTIVITY.CLIMBING_GARDEN) {
    const name = normalizeOptionalString(structuredOutput.name);

    if (!name) {
      return { activity: ACTIVITY.CLIMBING, subActivity: null };
    }

    return {
      activity: ACTIVITY.CLIMBING,
      subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_GARDEN,
      name,
    };
  }

  const routeName = normalizeOptionalString(structuredOutput.routeName);
  const routeNames = normalizeRouteNames(structuredOutput.routeNames, routeName);
  const summit = normalizeOptionalString(structuredOutput.summit);

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

function normalizeOptionalString(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized === '' ? null : normalized;
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
