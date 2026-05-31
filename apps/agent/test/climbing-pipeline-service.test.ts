import { describe, expect, test } from 'bun:test';
import { runClimbingPipelineService } from '../src/mastra/services/climbing-pipeline-service';
import {
  ACTIVITY,
  PREPROCESSOR_STATUS,
  type HikrOrgPostBaseLayerInput,
  type ReportBaseSchemaWriteInput,
} from '../src/mastra/workflows/baselayer';
import {
  CLIMBING_PREPROCESSOR_SCHEMA_VERSION,
  CLIMBING_SUB_ACTIVITY,
  type ClimbingGardenBasePreprocessorOutput,
  type ClimbingPreprocessorOutput,
  type ClimbingTourBasePreprocessorOutput,
} from '../src/mastra/workflows/climbing';
import { CLIMBING_ROUTE_LOOKUP_CONTEXT_KEY } from '../src/mastra/tools/climbing-route-lookup-tool';

const longDescription = 'Kletterbericht '.repeat(150);

type ClimbingPipelineMastra = Parameters<typeof runClimbingPipelineService>[0]['mastra'];
type WorkflowResult = { status: 'success'; result: ClimbingPreprocessorOutput };

function hikrOrgPost(
  overrides: Partial<HikrOrgPostBaseLayerInput> = {},
): HikrOrgPostBaseLayerInput {
  return {
    id: 42n,
    title: 'Gross Turm - Südgrat',
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

function climbingOutput(
  overrides: Partial<ClimbingPreprocessorOutput> = {},
): ClimbingPreprocessorOutput {
  return {
    base: {
      reportId: 42n,
      status: PREPROCESSOR_STATUS.READY,
      activity: ACTIVITY.CLIMBING,
      subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR,
      canton: 'Obwalden',
      tourDate: new Date('2024-08-10T00:00:00.000Z'),
      region: 'Melchtal',
    },
    climbingTourBase: {
      reportId: 42n,
      schemaVersion: CLIMBING_PREPROCESSOR_SCHEMA_VERSION,
      routeName: 'Südgrat',
      routeNames: ['Südgrat'],
      summit: 'Gross Turm',
    },
    climbingGardenBase: null,
    normalizedDescription: longDescription,
    normalizedDescriptionLength: longDescription.length,
    reasons: ['ready'],
    skipReason: null,
    ...overrides,
  };
}

function createMastraStub(
  results: WorkflowResult[],
  startArgs: unknown[] = [],
): ClimbingPipelineMastra {
  let index = 0;

  return {
    getWorkflow: (workflowId: string) => {
      expect(workflowId).toBe('climbing-pipeline');

      return {
        createRun: async () => ({
          start: async (args: unknown) => {
            startArgs.push(args);
            return results[index++];
          },
        }),
      };
    },
  } as unknown as ClimbingPipelineMastra;
}

describe('climbing pipeline service', () => {
  test('runs the climbing workflow and writes ready climbing rows', async () => {
    const reportBaseWrites: ReportBaseSchemaWriteInput[] = [];
    const climbingTourBaseWrites: ClimbingTourBasePreprocessorOutput[] = [];
    const climbingGardenBaseWrites: ClimbingGardenBasePreprocessorOutput[] = [];
    const workflowStartArgs: Array<{
      requestContext?: { get: (key: string) => unknown };
    }> = [];
    const progressEvents: Array<{ type: string; [key: string]: unknown }> = [];

    const result = await runClimbingPipelineService({
      mastra: createMastraStub(
        [
          { status: 'success', result: climbingOutput() },
          {
            status: 'success',
            result: climbingOutput({
              base: {
                reportId: 43n,
                status: PREPROCESSOR_STATUS.INSUFFICIENT,
                activity: ACTIVITY.CLIMBING,
                subActivity: null,
                canton: 'Obwalden',
                tourDate: new Date('2024-08-10T00:00:00.000Z'),
                region: 'Melchtal',
              },
              climbingTourBase: null,
              reasons: ['description_too_short'],
            }),
          },
        ],
        workflowStartArgs,
      ),
      database: {
        findHikrOrgPostsForPreprocessing: () => [
          hikrOrgPost(),
          hikrOrgPost({ id: 43n, description: 'zu kurz' }),
        ],
        findRouteSummitNames: () => ['Gross Turm'],
        findRouteNames: () => [{ routeName: 'Südgrat', routeNames: ['Südgrat'] }],
        findRouteCragNames: () => ['Klettergarten Melchtal'],
        upsertReportBase: (input: ReportBaseSchemaWriteInput) => {
          reportBaseWrites.push(input);
        },
        upsertClimbingTourBase: (input: ClimbingTourBasePreprocessorOutput) => {
          climbingTourBaseWrites.push(input);
        },
        upsertClimbingGardenBase: (input: ClimbingGardenBasePreprocessorOutput) => {
          climbingGardenBaseWrites.push(input);
        },
      },
      onProgress: (event) => {
        progressEvents.push(event);
      },
    });

    expect(result.total).toBe(2);
    expect(result.statusCounts).toEqual({
      [PREPROCESSOR_STATUS.READY]: 1,
      [PREPROCESSOR_STATUS.SKIPPED]: 0,
      [PREPROCESSOR_STATUS.INSUFFICIENT]: 1,
    });
    expect(workflowStartArgs).toHaveLength(2);
    expect(
      workflowStartArgs[0].requestContext?.get(CLIMBING_ROUTE_LOOKUP_CONTEXT_KEY),
    ).toMatchObject({
      findRouteSummitNames: expect.any(Function),
      findRouteNames: expect.any(Function),
      findRouteCragNames: expect.any(Function),
    });
    expect(reportBaseWrites).toMatchObject([
      {
        reportId: 42n,
        status: PREPROCESSOR_STATUS.READY,
        activity: ACTIVITY.CLIMBING,
        subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR,
        canton: 'Obwalden',
        region: 'Melchtal',
        reasons: ['ready'],
      },
      {
        reportId: 43n,
        status: PREPROCESSOR_STATUS.INSUFFICIENT,
        activity: ACTIVITY.CLIMBING,
        canton: 'Obwalden',
        region: 'Melchtal',
        reasons: ['description_too_short'],
      },
    ]);
    expect(reportBaseWrites[0].tourDate?.toISOString()).toBe('2024-08-10T00:00:00.000Z');
    expect(climbingTourBaseWrites).toEqual([
      {
        reportId: 42n,
        schemaVersion: CLIMBING_PREPROCESSOR_SCHEMA_VERSION,
        routeName: 'Südgrat',
        routeNames: ['Südgrat'],
        summit: 'Gross Turm',
      },
    ]);
    expect(climbingGardenBaseWrites).toEqual([]);
    expect(progressEvents.map((event) => event.type)).toEqual([
      'source-loaded',
      'post-start',
      'post-success',
      'post-start',
      'post-success',
    ]);
    expect(progressEvents[0]).toMatchObject({ total: 2 });
    expect(progressEvents[2]).toMatchObject({
      index: 1,
      total: 2,
      reportId: 42n,
      status: PREPROCESSOR_STATUS.READY,
      routeName: 'Südgrat',
      routeNames: ['Südgrat'],
      summit: 'Gross Turm',
    });
    expect(progressEvents[4]).toMatchObject({
      index: 2,
      total: 2,
      reportId: 43n,
      status: PREPROCESSOR_STATUS.INSUFFICIENT,
    });
  });

  test('supports async database cursors and limits processed rows', async () => {
    const reportBaseWrites: ReportBaseSchemaWriteInput[] = [];

    async function* findHikrOrgPostsForPreprocessing() {
      yield hikrOrgPost({ id: 1n });
      yield hikrOrgPost({ id: 2n });
    }

    const result = await runClimbingPipelineService({
      mastra: createMastraStub([
        {
          status: 'success',
          result: climbingOutput({
            base: {
              reportId: 1n,
              status: PREPROCESSOR_STATUS.SKIPPED,
              activity: ACTIVITY.SKI_ALPINE_TOUR,
              subActivity: null,
              canton: 'Obwalden',
              tourDate: null,
              region: 'Melchtal',
            },
            climbingTourBase: null,
            reasons: ['non_climbing_activity'],
          }),
        },
      ]),
      database: {
        findHikrOrgPostsForPreprocessing,
        findRouteSummitNames: () => [],
        findRouteNames: () => [],
        findRouteCragNames: () => [],
        upsertReportBase: (input: ReportBaseSchemaWriteInput) => {
          reportBaseWrites.push(input);
        },
        upsertClimbingTourBase: () => {},
        upsertClimbingGardenBase: () => {},
      },
      limit: 1,
    });

    expect(result.total).toBe(1);
    expect(result.statusCounts).toEqual({
      [PREPROCESSOR_STATUS.READY]: 0,
      [PREPROCESSOR_STATUS.SKIPPED]: 1,
      [PREPROCESSOR_STATUS.INSUFFICIENT]: 0,
    });
    expect(reportBaseWrites.map((write) => write.reportId)).toEqual([1n]);
    expect(reportBaseWrites[0].reasons).toEqual(['non_climbing_activity']);
  });
});
