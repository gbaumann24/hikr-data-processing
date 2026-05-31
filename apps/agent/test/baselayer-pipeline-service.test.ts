import { describe, expect, test } from 'bun:test';
import { runBaseLayerPipelineService } from '../src/mastra/services/baselayer-pipeline-service';
import {
  PREPROCESSOR_STATUS,
  type BaseLayerGateOutput,
  type HikrOrgPostBaseLayerInput,
  type ReportBaseSchemaWriteInput,
} from '../src/mastra/workflows/baselayer';

const longDescription = 'Baselayer Bericht '.repeat(150);

type BaseLayerPipelineMastra = Parameters<typeof runBaseLayerPipelineService>[0]['mastra'];
type WorkflowResult = { status: 'success'; result: BaseLayerGateOutput };

function hikrOrgPost(
  overrides: Partial<HikrOrgPostBaseLayerInput> = {},
): HikrOrgPostBaseLayerInput {
  return {
    id: 42n,
    title: 'Gross Turm',
    regionPathCsv: 'Welt, Schweiz, Obwalden, Melchtal',
    description: longDescription,
    reportWaypoints: [],
    tourDate: new Date('2024-08-10T00:00:00.000Z'),
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

function baseLayerOutput(overrides: Partial<BaseLayerGateOutput> = {}): BaseLayerGateOutput {
  return {
    base: {
      reportId: 42n,
      status: PREPROCESSOR_STATUS.READY,
      activity: null,
      subActivity: null,
      canton: 'Obwalden',
      tourDate: new Date('2024-08-10T00:00:00.000Z'),
      region: 'Melchtal',
    },
    difficultyScales: {
      presentScales: ['klettern'],
      valuesByScale: { klettern: '5a' },
    },
    normalizedDescription: longDescription,
    normalizedDescriptionLength: longDescription.length,
    reasons: [],
    isInsufficient: false,
    ...overrides,
  };
}

function createMastraStub(results: WorkflowResult[]): BaseLayerPipelineMastra {
  let index = 0;

  return {
    getWorkflow: (workflowId: string) => {
      expect(workflowId).toBe('baselayer');

      return {
        createRun: async () => ({
          start: async () => results[index++],
        }),
      };
    },
  } as unknown as BaseLayerPipelineMastra;
}

describe('baselayer pipeline service', () => {
  test('runs the baselayer workflow and writes report base rows', async () => {
    const reportBaseWrites: ReportBaseSchemaWriteInput[] = [];

    const result = await runBaseLayerPipelineService({
      mastra: createMastraStub([
        { status: 'success', result: baseLayerOutput() },
        {
          status: 'success',
          result: baseLayerOutput({
            base: {
              reportId: 43n,
              status: PREPROCESSOR_STATUS.INSUFFICIENT,
              activity: null,
              subActivity: null,
              canton: 'Obwalden',
              tourDate: new Date('2024-08-10T00:00:00.000Z'),
              region: 'Melchtal',
            },
            reasons: ['description_too_short'],
            isInsufficient: true,
          }),
        },
      ]),
      database: {
        findHikrOrgPostsForPreprocessing: () => [
          hikrOrgPost(),
          hikrOrgPost({ id: 43n, description: 'zu kurz' }),
        ],
        upsertReportBase: (input) => {
          reportBaseWrites.push(input);
        },
      },
    });

    expect(result.total).toBe(2);
    expect(result.statusCounts).toEqual({
      [PREPROCESSOR_STATUS.READY]: 1,
      [PREPROCESSOR_STATUS.SKIPPED]: 0,
      [PREPROCESSOR_STATUS.INSUFFICIENT]: 1,
    });
    expect(reportBaseWrites).toMatchObject([
      {
        reportId: 42n,
        status: PREPROCESSOR_STATUS.READY,
        activity: null,
        canton: 'Obwalden',
        region: 'Melchtal',
        reasons: [],
      },
      {
        reportId: 43n,
        status: PREPROCESSOR_STATUS.INSUFFICIENT,
        reasons: ['description_too_short'],
      },
    ]);
  });
});
