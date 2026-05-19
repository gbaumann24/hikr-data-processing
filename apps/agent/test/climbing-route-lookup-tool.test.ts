import { describe, expect, test } from 'bun:test';
import { RequestContext } from '@mastra/core/request-context';
import { ACTIVITY } from '@hikr/shared';
import {
  CLIMBING_ROUTE_LOOKUP_CONTEXT_KEY,
  climbingRouteLookupTool,
  type ClimbingRouteLookup,
} from '../src/mastra/tools/climbing-route-lookup-tool';

describe('climbing route lookup tool', () => {
  test('lists all summit names for a canton', async () => {
    const summitInputs: unknown[] = [];
    const requestContext = createRequestContext({
      findRouteSummitNames: (input) => {
        summitInputs.push(input);
        return ['Gross Turm', 'Gross Turm', 'Chli Turm'];
      },
      findRouteNames: () => [],
    });

    const result = await climbingRouteLookupTool.execute!(
      { mode: 'summitsByCanton', canton: 'Obwalden' },
      { requestContext },
    );

    expect(summitInputs).toEqual([{ activity: ACTIVITY.CLIMBING, canton: 'Obwalden' }]);
    expect(result).toEqual({ names: ['Chli Turm', 'Gross Turm'] });
  });

  test('lists all route names for a canton and summit', async () => {
    const routeInputs: unknown[] = [];
    const requestContext = createRequestContext({
      findRouteSummitNames: () => [],
      findRouteNames: (input) => {
        routeInputs.push(input);
        return ['Sudgrat', 'Sudgrat', 'Westwand'];
      },
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
      { activity: ACTIVITY.CLIMBING, canton: 'Obwalden', summitName: 'Gross Turm' },
    ]);
    expect(result).toEqual({ names: ['Sudgrat', 'Westwand'] });
  });

  test('fails clearly when the route lookup dependency is missing', async () => {
    await expect(
      climbingRouteLookupTool.execute!(
        { mode: 'summitsByCanton', canton: 'Obwalden' },
        {},
      ),
    ).rejects.toThrow('Climbing route lookup is missing from Mastra request context');
  });
});

function createRequestContext(lookup: ClimbingRouteLookup): RequestContext {
  const requestContext = new RequestContext();
  requestContext.set(CLIMBING_ROUTE_LOOKUP_CONTEXT_KEY, lookup);
  return requestContext;
}
