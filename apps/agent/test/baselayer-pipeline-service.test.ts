import { describe, expect, test } from 'bun:test';
import { mastra, runBaseLayerPipelineService } from '../src/mastra';
import {
  PREPROCESSOR_STATUS,
  type HikrOrgPostBaseLayerInput,
  type ReportBaseSchemaWriteInput,
} from '../src/mastra/workflows/baselayer';

const longDescription = 'Baselayer Bericht '.repeat(150);

function hikrOrgPost(overrides: Partial<HikrOrgPostBaseLayerInput> = {}): HikrOrgPostBaseLayerInput {
  return {
    id: 42n,
    title: 'Gross Turm',
    regionPathCsv: 'Welt, Schweiz, Obwalden, Melchtal',
    description: longDescription,
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

describe('baselayer pipeline service', () => {
  test('runs the baselayer workflow and writes report base rows', async () => {
    const reportBaseWrites: ReportBaseSchemaWriteInput[] = [];

    const result = await runBaseLayerPipelineService({
      mastra,
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
      [PREPROCESSOR_STATUS.READY]: 0,
      [PREPROCESSOR_STATUS.SKIPPED]: 1,
      [PREPROCESSOR_STATUS.INSUFFICIENT]: 1,
    });
    expect(reportBaseWrites).toMatchObject([
      {
        reportId: 42n,
        status: PREPROCESSOR_STATUS.SKIPPED,
        activity: null,
        canton: 'Obwalden',
        region: 'Melchtal',
      },
      {
        reportId: 43n,
        status: PREPROCESSOR_STATUS.INSUFFICIENT,
      },
    ]);
  });
});
