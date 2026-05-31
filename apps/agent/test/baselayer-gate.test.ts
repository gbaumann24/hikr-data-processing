import { describe, expect, test } from 'bun:test';
import {
  BASELAYER_GATE_DECISION,
  BASELAYER_GATE_REASON,
  PREPROCESSOR_STATUS,
  gatePreparedBaseLayer,
  prepareBaseLayer,
  type BaseLayerGateAgentInput,
  type HikrOrgPostBaseLayerInput,
} from '../src/mastra/workflows/baselayer';

const longDescription = 'Baselayer Bericht '.repeat(150);

function baseInput(overrides: Partial<HikrOrgPostBaseLayerInput> = {}): HikrOrgPostBaseLayerInput {
  return {
    id: 42n,
    title: 'Gross Turm - Südgrat',
    regionPathCsv: 'Welt, Schweiz, Obwalden, Melchtal',
    tourDate: new Date('2024-08-10T00:00:00.000Z'),
    description: longDescription,
    hikingDifficulty: null,
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

describe('baselayer gate', () => {
  test('marks a single-route report as ready', async () => {
    const input = baseInput();
    const agentInputs: BaseLayerGateAgentInput[] = [];

    const result = await gatePreparedBaseLayer(input, prepareBaseLayer(input), {
      runBaseLayerGateAgent: async (agentInput) => {
        agentInputs.push(agentInput);
        return { decision: BASELAYER_GATE_DECISION.READY };
      },
    });

    expect(result.base.status).toBe(PREPROCESSOR_STATUS.READY);
    expect(result.reasons).toEqual([]);
    expect(agentInputs).toMatchObject([
      {
        title: 'Gross Turm - Südgrat',
        canton: 'Obwalden',
        region: 'Melchtal',
        tourDate: '2024-08-10',
        difficultyScales: [{ scale: 'klettern', value: '5a' }],
      },
    ]);
  });

  test('skips reports that describe multiple routes', async () => {
    const input = baseInput({
      title: 'Vier Tage im Grimselgebiet',
      description: `${longDescription} Tag 1 Route A. Tag 2 Route B. Tag 3 Route C. Tag 4 Route D.`,
    });

    const result = await gatePreparedBaseLayer(input, prepareBaseLayer(input), {
      runBaseLayerGateAgent: async () => ({
        decision: BASELAYER_GATE_DECISION.SKIP,
        reason: BASELAYER_GATE_REASON.MULTIPLE_ROUTES_IN_REPORT,
      }),
    });

    expect(result.base.status).toBe(PREPROCESSOR_STATUS.SKIPPED);
    expect(result.reasons).toEqual([BASELAYER_GATE_REASON.MULTIPLE_ROUTES_IN_REPORT]);
  });

  test('skips reports that are not about a mountain activity', async () => {
    const input = baseInput({
      title: 'Spaziergang durch das Dorf',
      description: `${longDescription} Gemütlicher Spaziergang durch das Dorfzentrum mit Kaffeehalt.`,
      climbingDifficulty: null,
    });

    const result = await gatePreparedBaseLayer(input, prepareBaseLayer(input), {
      runBaseLayerGateAgent: async () => ({
        decision: BASELAYER_GATE_DECISION.SKIP,
        reason: BASELAYER_GATE_REASON.NON_MOUNTAIN_ACTIVITY,
      }),
    });

    expect(result.base.status).toBe(PREPROCESSOR_STATUS.SKIPPED);
    expect(result.reasons).toEqual([BASELAYER_GATE_REASON.NON_MOUNTAIN_ACTIVITY]);
  });

  test('does not call the gate agent for insufficient reports', async () => {
    const input = baseInput({ description: 'zu kurz' });
    let called = false;

    const result = await gatePreparedBaseLayer(input, prepareBaseLayer(input), {
      runBaseLayerGateAgent: async () => {
        called = true;
        return { decision: BASELAYER_GATE_DECISION.READY };
      },
    });

    expect(called).toBe(false);
    expect(result.base.status).toBe(PREPROCESSOR_STATUS.INSUFFICIENT);
    expect(result.reasons).toEqual(['description_too_short']);
  });
});
