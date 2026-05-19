import { createTool } from '@mastra/core/tools';
import {
  ACTIVITY,
  CLIMBING_SUB_ACTIVITY,
  type ClimbingDataPipelineDatabase,
} from '@hikr/shared';
import { z } from 'zod';

export const CLIMBING_ROUTE_LOOKUP_CONTEXT_KEY = 'climbingRouteLookup';

export type ClimbingRouteLookup = Pick<
  ClimbingDataPipelineDatabase,
  'findRouteSummitNames' | 'findRouteNames' | 'findRouteCragNames'
>;

const lookupInputSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('summitsByCanton'),
    canton: z.string().min(1),
  }),
  z.object({
    mode: z.literal('routesByCantonAndSummit'),
    canton: z.string().min(1),
    summitName: z.string().min(1),
  }),
  z.object({
    mode: z.literal('cragsByCanton'),
    canton: z.string().min(1),
  }),
]);

const lookupOutputSchema = z.object({
  names: z.array(z.string()),
});

export const climbingRouteLookupTool = createTool({
  id: 'climbing-route-lookup-tool',
  description:
    'Lists existing climbing summit names for a canton, route names for a canton and summit, or crag names for a canton.',
  inputSchema: lookupInputSchema,
  outputSchema: lookupOutputSchema,
  execute: async (input, context) => {
    const lookup = context?.requestContext?.get(
      CLIMBING_ROUTE_LOOKUP_CONTEXT_KEY,
    ) as ClimbingRouteLookup | undefined;

    if (!lookup) {
      throw new Error('Climbing route lookup is missing from Mastra request context');
    }

    if (input.mode === 'summitsByCanton') {
      const names = await lookup.findRouteSummitNames({
        activity: ACTIVITY.CLIMBING,
        subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR,
        canton: input.canton,
      });

      return { names: normalizeNames(names) };
    }

    if (input.mode === 'cragsByCanton') {
      const names = await lookup.findRouteCragNames({
        activity: ACTIVITY.CLIMBING,
        subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_GARDEN,
        canton: input.canton,
      });

      return { names: normalizeNames(names) };
    }

    const names = await lookup.findRouteNames({
      activity: ACTIVITY.CLIMBING,
      subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR,
      canton: input.canton,
      summitName: input.summitName,
    });

    return { names: normalizeNames(names) };
  },
});

function normalizeNames(names: string[]): string[] {
  return [...new Set(names.map((name) => name.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}
