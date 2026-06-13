import { describe, expect, test } from 'bun:test';
import {
  ACTIVITY,
  PREPROCESSOR_STATUS,
  normalizeDescription,
  parseRegionPath,
  type HikrOrgPostBaseLayerInput,
} from '../src/mastra/workflows/baselayer';
import {
  CLIMBING_SUB_ACTIVITY,
  classifyActivity,
  createMastraClimbingPreprocessorAgentRunner,
  parseClimbingPreprocessorAgentOutput,
  preprocessHikrReportForClimbing,
  type ClimbingPreprocessorAgentInput,
} from '../src/mastra/workflows/climbing';

const longDescription = 'Kletterbericht '.repeat(150);

function baseInput(overrides: Partial<HikrOrgPostBaseLayerInput> = {}): HikrOrgPostBaseLayerInput {
  return {
    id: 42n,
    title: 'Gross Turm - Südgrat',
    regionPathCsv: 'Welt, Schweiz, Obwalden, Melchtal',
    description: longDescription,
    reportWaypoints: [],
    tourDate: new Date('2024-08-10T00:00:00.000Z'),
    hikingDifficulty: 'T4',
    alpineTourDifficulty: null,
    climbingDifficulty: '5a',
    snowshoeTourDifficulty: null,
    viaFerrataDifficulty: null,
    skiDifficulty: null,
    iceClimbingDifficulty: null,
    mountainBikeDifficulty: null,
    ...overrides,
  };
}

describe('climbing preprocessor', () => {
  test('normalizes HTML descriptions before counting length', () => {
    expect(normalizeDescription('<p>A&nbsp; B</p><br>C')).toBe('A B C');
  });

  test('parses canton and region from region_path_csv', () => {
    expect(parseRegionPath('"Welt","Schweiz","Obwalden","Melchtal"')).toMatchObject({
      canton: 'Obwalden',
      region: 'Melchtal',
    });
  });

  test('accepts canton without extra region', () => {
    expect(parseRegionPath('Welt, Schweiz, Obwalden')).toMatchObject({
      canton: 'Obwalden',
      region: null,
    });
  });

  test('uses HIKR canton container names as canonical canton values', () => {
    expect(parseRegionPath('Welt, Schweiz, Appenzell, Alpstein')).toMatchObject({
      canton: 'Appenzell',
      region: 'Alpstein',
    });
    expect(parseRegionPath('Welt, Schweiz, Basel Land')).toMatchObject({
      canton: 'Basel Land',
    });
    expect(parseRegionPath('Welt, Schweiz, St.Gallen, Alpstein')).toMatchObject({
      canton: 'St.Gallen',
      region: 'Alpstein',
    });
  });

  test('classifies exact activity scale combinations', () => {
    expect(classifyActivity(baseInput()).activity).toBe('Klettern');
    expect(classifyActivity(baseInput({ hikingDifficulty: null })).activity).toBe('Klettern');
    expect(
      classifyActivity(
        baseInput({ hikingDifficulty: null, climbingDifficulty: null, skiDifficulty: 'ZS' }),
      ).activity,
    ).toBe('Skitour');
    expect(
      classifyActivity(
        baseInput({
          hikingDifficulty: null,
          climbingDifficulty: '4a',
          skiDifficulty: 'ZS',
          alpineTourDifficulty: 'WS',
        }),
      ).activity,
    ).toBe('Skihochtour');
    expect(classifyActivity(baseInput({ alpineTourDifficulty: 'WS' })).activity).toBe('Hochtour');
  });

  test('unsupported scales always skip activity classification', async () => {
    const result = classifyActivity(baseInput({ viaFerrataDifficulty: 'K3' }));

    expect(result.activity).toBeNull();
    expect(result.unsupportedScales).toEqual(['klettersteig']);

    const mountainBikeResult = await preprocessHikrReportForClimbing(
      baseInput({ mountainBikeDifficulty: 'S2' }),
      {
        runClimbingPreprocessorAgent: async () => ({
          activity: ACTIVITY.CLIMBING,
          subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR,
          routeName: 'Südgrat',
          routeNames: ['Südgrat'],
          summit: 'Gross Turm',
        }),
      },
    );

    expect(mountainBikeResult.base.status).toBe(PREPROCESSOR_STATUS.SKIPPED);
    expect(mountainBikeResult.base.activity).toBeNull();
    expect(mountainBikeResult.reasons).toEqual(['unsupported_activity_scales']);
    expect(mountainBikeResult.skipReason).toBe(
      'Report uses unsupported activity difficulty scales.',
    );
  });

  test('returns insufficient when description is too short', async () => {
    const result = await preprocessHikrReportForClimbing(baseInput({ description: 'zu kurz' }));

    expect(result.base.status).toBe(PREPROCESSOR_STATUS.INSUFFICIENT);
    expect(result.reasons).toContain('description_too_short');
    expect(result.skipReason).toBeNull();
  });

  test('returns insufficient when canton is missing', async () => {
    const result = await preprocessHikrReportForClimbing(
      baseInput({ regionPathCsv: 'Welt, Frankreich, Haute-Savoie' }),
    );

    expect(result.base.status).toBe(PREPROCESSOR_STATUS.INSUFFICIENT);
    expect(result.reasons).toContain('missing_canton');
  });

  test('skips non-climbing activities but preserves activity', async () => {
    const result = await preprocessHikrReportForClimbing(
      baseInput({
        hikingDifficulty: null,
        climbingDifficulty: null,
        skiDifficulty: 'ZS',
      }),
    );

    expect(result.base.status).toBe(PREPROCESSOR_STATUS.SKIPPED);
    expect(result.base.activity).toBe('Skitour');
    expect(result.reasons).toEqual(['non_climbing_activity']);
    expect(result.skipReason).toBe('Report activity is Skitour, not Klettern.');
  });

  test('sets climbing tour output when preprocessor agent returns route and summit', async () => {
    const agentInputs: ClimbingPreprocessorAgentInput[] = [];
    const result = await preprocessHikrReportForClimbing(
      baseInput({
        reportWaypoints: [
          { position: 2, waypoint: { name: 'Gross Turm', heightMeters: null } },
          { position: 1, waypoint: { name: 'Ausgangspunkt Melchtal', heightMeters: null } },
          { position: 3, waypoint: { name: 'Gross Turm', heightMeters: null } },
          { position: 4, waypoint: { name: '  ', heightMeters: null } },
        ],
      }),
      {
        runClimbingPreprocessorAgent: async (input) => {
          agentInputs.push(input);
          return {
            activity: ACTIVITY.CLIMBING,
            subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR,
            routeName: 'Südgrat',
            routeNames: ['Südgrat', 'S-Grat'],
            summit: 'Gross Turm',
          };
        },
      },
    );

    expect(result.base.status).toBe(PREPROCESSOR_STATUS.READY);
    expect(result.base.subActivity).toBe(CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR);
    expect(agentInputs).toMatchObject([
      {
        canton: 'Obwalden',
        difficultyScales: [
          { scale: 'wandern', value: 'T4' },
          { scale: 'klettern', value: '5a' },
        ],
        hikrWaypointNames: ['Ausgangspunkt Melchtal', 'Gross Turm'],
      },
    ]);
    expect(result.climbingTourBase).toMatchObject({
      routeName: 'Südgrat',
      routeNames: ['Südgrat', 'S-Grat'],
      summit: 'Gross Turm',
    });
    expect(result.climbingGardenBase).toBeNull();
    expect(result.skipReason).toBeNull();
  });

  test('sets climbing garden output when preprocessor agent returns a climbing garden', async () => {
    const result = await preprocessHikrReportForClimbing(baseInput(), {
      runClimbingPreprocessorAgent: async () => ({
        activity: ACTIVITY.CLIMBING,
        subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_GARDEN,
        name: 'Klettergarten Melchtal',
      }),
    });

    expect(result.base.status).toBe(PREPROCESSOR_STATUS.READY);
    expect(result.base.subActivity).toBe(CLIMBING_SUB_ACTIVITY.CLIMBING_GARDEN);
    expect(result.climbingTourBase).toBeNull();
    expect(result.climbingGardenBase).toEqual({
      reportId: 42n,
      name: 'Klettergarten Melchtal',
    });
  });

  test('skips when preprocessor agent finds no climbing sub-activity', async () => {
    const result = await preprocessHikrReportForClimbing(baseInput(), {
      runClimbingPreprocessorAgent: async () => ({
        activity: ACTIVITY.CLIMBING,
        subActivity: null,
      }),
    });

    expect(result.base.status).toBe(PREPROCESSOR_STATUS.SKIPPED);
    expect(result.reasons).toEqual(['no_climbing_preprocessor_agent_match']);
    expect(result.skipReason).toBe(
      'Climbing preprocessor agent did not identify a Klettertour or Klettergarten.',
    );
  });

  test('changes activity to hiking when the agent says hiking outweighs climbing', async () => {
    const result = await preprocessHikrReportForClimbing(
      baseInput({
        description: `${'Wanderbericht auf markiertem Weg mit langer Zustiegspassage. '.repeat(35)}Kurze leichte Kletterstelle im I. Grad, danach weiter als Wanderung zum Gipfel.`,
        climbingDifficulty: 'I',
      }),
      {
        runClimbingPreprocessorAgent: async () => ({
          activity: ACTIVITY.HIKING,
          subActivity: null,
        }),
      },
    );

    expect(result.base.status).toBe(PREPROCESSOR_STATUS.SKIPPED);
    expect(result.base.activity).toBe(ACTIVITY.HIKING);
    expect(result.base.subActivity).toBeNull();
    expect(result.climbingTourBase).toBeNull();
    expect(result.climbingGardenBase).toBeNull();
    expect(result.reasons).toEqual(['non_climbing_activity']);
    expect(result.skipReason).toBe('Report activity is Wanderung, not Klettern.');
  });

  test('passes HIKR waypoint names to the Mastra agent context', async () => {
    const messages: string[] = [];
    const runner = createMastraClimbingPreprocessorAgentRunner({
      generate: async (message: string) => {
        messages.push(message);
        return {
          object: {
            activity: ACTIVITY.HIKING,
            subActivity: null,
            routeName: null,
            routeNames: null,
            summit: null,
            name: null,
          },
        };
      },
    });

    await runner({
      title: 'Gross Turm - Südgrat',
      description: longDescription,
      canton: 'Obwalden',
      difficultyScales: [],
      hikrWaypointNames: ['Ausgangspunkt Melchtal', 'Gross Turm'],
    });

    expect(messages[0]).toContain('HIKR waypoints:\n- Ausgangspunkt Melchtal\n- Gross Turm');
  });

  test('treats incomplete structured agent output as no match', async () => {
    expect(
      parseClimbingPreprocessorAgentOutput({
        activity: ACTIVITY.CLIMBING,
        subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR,
        routeName: 'Südgrat',
        routeNames: ['Südgrat'],
        summit: null,
        name: null,
      }),
    ).toEqual({ activity: ACTIVITY.CLIMBING, subActivity: null });

    expect(
      parseClimbingPreprocessorAgentOutput({
        activity: ACTIVITY.CLIMBING,
        subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_GARDEN,
        routeName: null,
        routeNames: null,
        summit: null,
        name: '',
      }),
    ).toEqual({ activity: ACTIVITY.CLIMBING, subActivity: null });
  });

  test('parses hiking activity without extracting climbing names', () => {
    expect(
      parseClimbingPreprocessorAgentOutput({
        activity: ACTIVITY.HIKING,
        subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR,
        routeName: 'Südgrat',
        routeNames: ['Südgrat'],
        summit: 'Gross Turm',
        name: null,
      }),
    ).toEqual({ activity: ACTIVITY.HIKING, subActivity: null });
  });

  test('parses multiple route names for the same climbing tour', () => {
    expect(
      parseClimbingPreprocessorAgentOutput({
        activity: ACTIVITY.CLIMBING,
        subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR,
        routeName: 'Südgrat',
        routeNames: ['Südgrat', 'S-Grat', 'Südgrat'],
        summit: 'Gross Turm',
        name: null,
      }),
    ).toEqual({
      activity: ACTIVITY.CLIMBING,
      subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR,
      routeName: 'Südgrat',
      routeNames: ['Südgrat', 'S-Grat'],
      summit: 'Gross Turm',
    });
  });
});
