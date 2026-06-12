import { describe, expect, test } from 'bun:test';
import type { ClimbingTourDetailsSchemaWriteInput } from '@hikr/shared';
import { runClimbingPipelineService } from '../src/mastra/services/climbing-pipeline-service';
import {
  ACTIVITY,
  PREPROCESSOR_STATUS,
  type HikrOrgPostBaseLayerInput,
  type ReportBaseSchemaWriteInput,
} from '../src/mastra/workflows/baselayer';
import {
  CLIMBING_EXTRACTION_SCHEMA_VERSION,
  CLIMBING_PREPROCESSOR_SCHEMA_VERSION,
  CLIMBING_SUB_ACTIVITY,
  extractPreparedClimbingReport,
  preprocessHikrReportForClimbing,
  type ClimbingExtractionAgentResult,
  type ClimbingExtractionOutput,
  type ClimbingGardenBasePreprocessorOutput,
  type ClimbingTourBasePreprocessorOutput,
} from '../src/mastra/workflows/climbing';
import { CLIMBING_ROUTE_LOOKUP_CONTEXT_KEY } from '../src/mastra/tools/climbing-route-lookup-tool';

const longDescription = 'Kletterbericht '.repeat(150);

type ClimbingPipelineMastra = Parameters<typeof runClimbingPipelineService>[0]['mastra'];
type WorkflowResult = { status: 'success'; result: ClimbingExtractionOutput };

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
  overrides: Partial<ClimbingExtractionOutput> = {},
): ClimbingExtractionOutput {
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
    extraction: climbingExtraction(),
    ...overrides,
  };
}

// Builds a minimal climbing extraction payload for service persistence assertions.
function climbingExtraction(
  overrides: Partial<ClimbingExtractionAgentResult> = {},
): ClimbingExtractionAgentResult {
  return {
    schemaVersion: CLIMBING_EXTRACTION_SCHEMA_VERSION,
    zeitbedarf: {
      zustieg_min: 45,
      reine_kletterzeit_min: 180,
    },
    klettern: {
      schluesselstellen: {
        vorhanden: true,
        stellen: [{ wo: '2. Seillänge', beschreibung: 'kurzer Plattenzug' }],
      },
    },
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
    const climbingTourDetailsWrites: ClimbingTourDetailsSchemaWriteInput[] = [];
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
              extraction: null,
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
        upsertClimbingTourDetails: (input: ClimbingTourDetailsSchemaWriteInput) => {
          climbingTourDetailsWrites.push(input);
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
    expect(climbingTourDetailsWrites).toEqual([
      {
        reportId: 42n,
        schemaVersion: CLIMBING_EXTRACTION_SCHEMA_VERSION,
        zeitbedarf: {
          zustieg_min: 45,
          reine_kletterzeit_min: 180,
        },
        klettern: {
          schluesselstellen: {
            vorhanden: true,
            stellen: [{ wo: '2. Seillänge', beschreibung: 'kurzer Plattenzug' }],
          },
        },
      },
    ]);
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

  test('processes scraped source data through preprocessing and extraction before persistence', async () => {
    const reportBaseWrites: ReportBaseSchemaWriteInput[] = [];
    const climbingTourBaseWrites: ClimbingTourBasePreprocessorOutput[] = [];
    const climbingTourDetailsWrites: ClimbingTourDetailsSchemaWriteInput[] = [];
    const sourcePost = hikrOrgPost({
      description:
        `${'Zustieg zum Einstieg, danach Kletterei in gutem Fels. '.repeat(80)}` +
        'Die Schluesselstelle folgt in der zweiten Seillaenge.',
    });

    const mastra = {
      getWorkflow: (workflowId: string) => {
        expect(workflowId).toBe('climbing-pipeline');

        return {
          createRun: async () => ({
            start: async ({ inputData }: { inputData: HikrOrgPostBaseLayerInput }) => {
              const preprocessed = await preprocessHikrReportForClimbing(inputData, {
                runClimbingPreprocessorAgent: async () => ({
                  activity: ACTIVITY.CLIMBING,
                  subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR,
                  routeName: 'Südgrat',
                  routeNames: ['Südgrat'],
                  summit: 'Gross Turm',
                }),
              });
              const extracted = await extractPreparedClimbingReport(preprocessed, {
                title: inputData.title,
                extractClimbing: async ({ preprocessed }) => {
                  expect(preprocessed.climbingTourBase?.routeName).toBe('Südgrat');

                  return climbingExtraction({
                    zeitbedarf: {
                      zustieg_min: 50,
                    },
                    klettern: {
                      schluesselstellen: {
                        vorhanden: true,
                        stellen: [{ wo: 'zweite Seillänge', beschreibung: 'Schluesselstelle' }],
                      },
                    },
                  });
                },
              });

              return { status: 'success', result: extracted };
            },
          }),
        };
      },
    } as unknown as ClimbingPipelineMastra;

    const result = await runClimbingPipelineService({
      mastra,
      database: {
        findHikrOrgPostsForPreprocessing: () => [sourcePost],
        findRouteSummitNames: () => [],
        findRouteNames: () => [],
        findRouteCragNames: () => [],
        upsertReportBase: (input: ReportBaseSchemaWriteInput) => {
          reportBaseWrites.push(input);
        },
        upsertClimbingTourBase: (input: ClimbingTourBasePreprocessorOutput) => {
          climbingTourBaseWrites.push(input);
        },
        upsertClimbingGardenBase: () => {},
        upsertClimbingTourDetails: (input: ClimbingTourDetailsSchemaWriteInput) => {
          climbingTourDetailsWrites.push(input);
        },
      },
    });

    expect(result).toEqual({
      total: 1,
      statusCounts: {
        [PREPROCESSOR_STATUS.READY]: 1,
        [PREPROCESSOR_STATUS.SKIPPED]: 0,
        [PREPROCESSOR_STATUS.INSUFFICIENT]: 0,
      },
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
    ]);
    expect(climbingTourBaseWrites).toEqual([
      {
        reportId: 42n,
        schemaVersion: CLIMBING_PREPROCESSOR_SCHEMA_VERSION,
        routeName: 'Südgrat',
        routeNames: ['Südgrat'],
        summit: 'Gross Turm',
      },
    ]);
    expect(climbingTourDetailsWrites).toEqual([
      {
        reportId: 42n,
        schemaVersion: CLIMBING_EXTRACTION_SCHEMA_VERSION,
        zeitbedarf: {
          zustieg_min: 50,
        },
        klettern: {
          schluesselstellen: {
            vorhanden: true,
            stellen: [{ wo: 'zweite Seillänge', beschreibung: 'Schluesselstelle' }],
          },
        },
      },
    ]);
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
            extraction: null,
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
        upsertClimbingTourDetails: () => {},
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
