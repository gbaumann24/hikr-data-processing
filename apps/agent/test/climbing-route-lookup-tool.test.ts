import { describe, expect, test } from 'bun:test';
import { RequestContext } from '@mastra/core/request-context';
import { ACTIVITY, CLIMBING_SUB_ACTIVITY } from '@hikr/shared';
import {
  CLIMBING_ROUTE_LOOKUP_CONTEXT_KEY,
  climbingRouteLookupTool,
  type ClimbingRouteLookup,
} from '../src/mastra/tools/climbing-route-lookup-tool';

describe('climbing route lookup tool', () => {
  // Reproduces LLM tool calls that include unused blank optional fields.
  test('accepts unused blank summit fields when listing summit names', () => {
    const inputSchema = climbingRouteLookupTool.inputSchema as unknown as {
      parse: (input: unknown) => unknown;
    };

    expect(
      inputSchema.parse({
        mode: 'summitsByCanton',
        canton: 'Uri',
        summitName: '',
        heightMeters: null,
      }),
    ).toEqual({
      mode: 'summitsByCanton',
      canton: 'Uri',
      summitName: '',
      heightMeters: null,
    });
  });

  test('lists all summit names for a canton', async () => {
    const summitInputs: unknown[] = [];
    const requestContext = createRequestContext({
      findRouteSummitNames: (input) => {
        summitInputs.push(input);
        return ['Gross Turm', 'Gross Turm', 'Chli Turm'];
      },
      findRouteNames: () => [],
      findRouteCragNames: () => [],
      updateSummitHeightIfMissing: () => Promise.resolve(),
    });

    const result = await climbingRouteLookupTool.execute!(
      { mode: 'summitsByCanton', canton: 'Obwalden' },
      { requestContext },
    );

    expect(summitInputs).toEqual([
      {
        activity: ACTIVITY.CLIMBING,
        subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR,
        canton: 'Obwalden',
      },
    ]);
    expect(result).toEqual({ names: ['Chli Turm', 'Gross Turm'] });
  });

  test('lists all route names for a canton and summit', async () => {
    const routeInputs: unknown[] = [];
    const requestContext = createRequestContext({
      findRouteSummitNames: () => [],
      findRouteNames: (input) => {
        routeInputs.push(input);
        return [
          { routeName: 'Sudgrat', routeNames: ['Sudgrat', 'S-Grat'] },
          { routeName: 'Sudgrat', routeNames: ['Sudgrat'] },
          { routeName: 'Westwand', routeNames: ['Westwand'] },
        ];
      },
      findRouteCragNames: () => [],
      updateSummitHeightIfMissing: () => Promise.resolve(),
    });

    const result = await climbingRouteLookupTool.execute!(
      {
        mode: 'routesByCantonAndSummit',
        canton: 'Obwalden',
        summitName: 'Gross Turm',
      },
      { requestContext },
    );

    expect(routeInputs).toEqual([
      {
        activity: ACTIVITY.CLIMBING,
        subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR,
        canton: 'Obwalden',
        summitName: 'Gross Turm',
      },
    ]);
    expect(result).toEqual({
      names: ['Sudgrat', 'Westwand'],
      routes: [
        { routeName: 'Sudgrat', routeNames: ['Sudgrat', 'S-Grat'] },
        { routeName: 'Westwand', routeNames: ['Westwand'] },
      ],
    });
  });

  test('lists all crag names for a canton', async () => {
    const cragInputs: unknown[] = [];
    const requestContext = createRequestContext({
      findRouteSummitNames: () => [],
      findRouteNames: () => [],
      findRouteCragNames: (input) => {
        cragInputs.push(input);
        return ['Klettergarten Melchtal', 'Klettergarten Melchtal', 'Ofen'];
      },
      updateSummitHeightIfMissing: () => Promise.resolve(),
    });

    const result = await climbingRouteLookupTool.execute!(
      { mode: 'cragsByCanton', canton: 'Obwalden' },
      { requestContext },
    );

    expect(cragInputs).toEqual([
      {
        activity: ACTIVITY.CLIMBING,
        subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_GARDEN,
        canton: 'Obwalden',
      },
    ]);
    expect(result).toEqual({ names: ['Klettergarten Melchtal', 'Ofen'] });
  });

  test('fails clearly when the route lookup dependency is missing', async () => {
    await expect(
      climbingRouteLookupTool.execute!({ mode: 'summitsByCanton', canton: 'Obwalden' }, {}),
    ).rejects.toThrow('Climbing route lookup is missing from Mastra request context');
  });
});

function createRequestContext(lookup: ClimbingRouteLookup): RequestContext {
  const requestContext = new RequestContext();
  requestContext.set(CLIMBING_ROUTE_LOOKUP_CONTEXT_KEY, lookup);
  return requestContext;
}
