import { createTool } from '@mastra/core/tools';
import { ACTIVITY, CLIMBING_SUB_ACTIVITY, type ClimbingDataPipelineDatabase } from '@hikr/shared';
import { z } from 'zod';

export const CLIMBING_ROUTE_LOOKUP_CONTEXT_KEY = 'climbingRouteLookup';

export type ClimbingRouteLookup = Pick<
  ClimbingDataPipelineDatabase,
  'findRouteSummitNames' | 'findRouteNames' | 'findRouteCragNames'
>;

const lookupInputSchema = z
  .object({
    mode: z.enum(['summitsByCanton', 'routesByCantonAndSummit', 'cragsByCanton']),
    canton: z.string().min(1),
    summitName: z.string().min(1).optional(),
  })
  .superRefine((input, context) => {
    if (input.mode === 'routesByCantonAndSummit' && !input.summitName) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'summitName is required when mode is routesByCantonAndSummit',
        path: ['summitName'],
      });
    }
  });

const lookupOutputSchema = z.object({
  names: z.array(z.string()),
  routes: z
    .array(
      z.object({
        routeName: z.string(),
        routeNames: z.array(z.string()),
      }),
    )
    .optional(),
});

export const climbingRouteLookupTool = createTool({
  id: 'climbing-route-lookup-tool',
  description:
    'Lists existing climbing summit names for a canton, canonical route names and stored route aliases for a canton and summit, or crag names for a canton.',
  inputSchema: lookupInputSchema,
  outputSchema: lookupOutputSchema,
  execute: async (input, context) => {
    const lookup = context?.requestContext?.get(CLIMBING_ROUTE_LOOKUP_CONTEXT_KEY) as
      | ClimbingRouteLookup
      | undefined;

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

    if (!input.summitName) {
      throw new Error('summitName is required when mode is routesByCantonAndSummit');
    }

    const routes = normalizeRouteLookupRoutes(
      await lookup.findRouteNames({
        activity: ACTIVITY.CLIMBING,
        subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR,
        canton: input.canton,
        summitName: input.summitName,
      }),
    );

    return {
      names: routes.map((route) => route.routeName),
      routes,
    };
  },
});

function normalizeRouteLookupRoutes(
  routes: Array<{ routeName: string; routeNames: string[] }>,
): Array<{ routeName: string; routeNames: string[] }> {
  const routesByCanonicalName = new Map<string, string[]>();

  for (const route of routes) {
    const routeName = route.routeName.trim();

    if (!routeName) {
      continue;
    }

    routesByCanonicalName.set(
      routeName,
      normalizeRouteNames(routeName, [
        ...(routesByCanonicalName.get(routeName) ?? []),
        ...route.routeNames,
      ]),
    );
  }

  return [...routesByCanonicalName.entries()]
    .map(([routeName, routeNames]) => ({ routeName, routeNames }))
    .sort((left, right) => left.routeName.localeCompare(right.routeName));
}

function normalizeNames(names: string[]): string[] {
  return [...new Set(names.map((name) => name.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function normalizeRouteNames(routeName: string, routeNames: string[]): string[] {
  return [
    routeName,
    ...new Set(
      routeNames.map((name) => name.trim()).filter((name) => name !== '' && name !== routeName),
    ),
  ];
}
