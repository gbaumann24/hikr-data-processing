import { describe, expect, test } from 'bun:test';
import {
	PREPROCESSOR_STATUS,
	type HikrOrgPostBaseLayerInput,
	type ReportBaseSchemaWriteInput,
} from '../src/mastra/workflows/baselayer';
import { CLIMBING_SUB_ACTIVITY, runClimbingDataPipeline } from '../src/mastra/workflows/climbing';

const longDescription = 'Kletterbericht '.repeat(150);

function hikrOrgPost(overrides: Partial<HikrOrgPostBaseLayerInput> = {}): HikrOrgPostBaseLayerInput {
	return {
		id: 42n,
		title: 'Gross Turm - Südgrat',
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

describe('climbing data pipeline', () => {
	test('loads database rows into baselayer before running the climbing preprocessor', async () => {
		const reportBaseWrites: ReportBaseSchemaWriteInput[] = [];

		const result = await runClimbingDataPipeline({
			database: {
				findHikrOrgPostsForClimbingPreprocessing: () => [
					hikrOrgPost(),
					hikrOrgPost({ id: 43n, description: 'zu kurz' }),
				],
				upsertReportBase: (input) => { reportBaseWrites.push(input); },
				upsertClimbingTourBase: () => {},
				upsertClimbingGardenBase: () => {},
			},
			classifySubActivity: async () => ({
				subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR,
				routeName: 'Südgrat',
				summit: 'Gross Turm',
			}),
		});

		expect(result.total).toBe(2);
		expect(result.statusCounts).toEqual({
			[PREPROCESSOR_STATUS.READY]: 1,
			[PREPROCESSOR_STATUS.SKIPPED]: 0,
			[PREPROCESSOR_STATUS.INSUFFICIENT]: 1,
		});

		expect(result.items[0].baseLayer.base.status).toBe(PREPROCESSOR_STATUS.SKIPPED);
		expect(result.items[0].climbing.base.status).toBe(PREPROCESSOR_STATUS.READY);
		expect(result.items[0].climbing.climbingTourBase).toMatchObject({
			routeName: 'Südgrat',
			summit: 'Gross Turm',
		});
		expect(reportBaseWrites).toMatchObject([
			{
				reportId: 42n,
				status: PREPROCESSOR_STATUS.READY,
				activity: 'Klettern',
				subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR,
				canton: 'Obwalden',
				region: 'Melchtal',
			},
			{
				reportId: 43n,
				status: PREPROCESSOR_STATUS.INSUFFICIENT,
				canton: 'Obwalden',
				region: 'Melchtal',
			},
		]);
		expect(reportBaseWrites[0].tourDate?.toISOString()).toBe('2024-08-10T00:00:00.000Z');

		expect(result.items[1].baseLayer.reasons).toEqual(['description_too_short']);
		expect(result.items[1].climbing.base.status).toBe(PREPROCESSOR_STATUS.INSUFFICIENT);
	});

	test('supports async database cursors and limits processed rows', async () => {
		const reportBaseWrites: ReportBaseSchemaWriteInput[] = [];

		async function* findHikrOrgPostsForClimbingPreprocessing() {
			yield hikrOrgPost({ id: 1n });
			yield hikrOrgPost({ id: 2n });
		}

		const result = await runClimbingDataPipeline({
			database: {
				findHikrOrgPostsForClimbingPreprocessing,
				upsertReportBase: (input) => { reportBaseWrites.push(input); },
				upsertClimbingTourBase: () => {},
				upsertClimbingGardenBase: () => {},
			},
			limit: 1,
			classifySubActivity: null,
		});

		expect(result.total).toBe(1);
		expect(result.items[0].input.reportId).toBe(1n);
		expect(result.items[0].climbing.reasons).toEqual(['missing_sub_activity_classifier']);
		expect(reportBaseWrites.map((write) => write.reportId)).toEqual([1n]);
	});
});
