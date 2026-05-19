import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Database } from 'bun:sqlite';
import { describe, expect, test } from 'bun:test';
import { ACTIVITY, type HikrOrgPostBaseLayerInput } from 'agent/mastra';
import { runClimbingDataPipeline } from 'agent/mastra';

const sqlitePath = fileURLToPath(new URL('../../../hikr.sqlite', import.meta.url));
const datasetTest = existsSync(sqlitePath) ? test : test.skip;

type HikrSqliteReportRow = {
	id: number;
	title: string | null;
	region_path_csv: string | null;
	tour_date: string | null;
	description: string | null;
	wandern_schwierigkeit: string | null;
	hochtouren_schwierigkeit: string | null;
	klettern_schwierigkeit: string | null;
	schneeschuhtouren_schwierigkeit: string | null;
	klettersteig_schwierigkeit: string | null;
	ski_schwierigkeit: string | null;
	eisklettern_schwierigkeit: string | null;
	mountainbike_schwierigkeit: string | null;
};

describe('hikr sqlite dataset', () => {
	datasetTest('runs the climbing pipeline over the local sqlite export', async () => {
		const db = new Database(sqlitePath, { readonly: true });

		try {
			const rows = db
				.query('select * from hikr_reports order by id')
				.all() as HikrSqliteReportRow[];
			const reportBaseWrites: unknown[] = [];

			const result = await runClimbingDataPipeline({
				database: {
					findHikrOrgPostsForClimbingPreprocessing: () =>
						rows.map(mapSqliteReportToBaseLayerInput),
					upsertReportBase: (input) => { reportBaseWrites.push(input); },
					upsertClimbingTourBase: () => {},
					upsertClimbingGardenBase: () => {},
				},
				classifySubActivity: null,
			});

			expect(result.total).toBe(170);
			expect(reportBaseWrites).toHaveLength(170);
			expect(result.statusCounts).toEqual({
				ready: 0,
				skipped: 130,
				insufficient: 40,
			});
			expect(countBy(result.items, (item) => item.climbing.base.activity ?? 'null')).toEqual({
				[ACTIVITY.CLIMBING]: 120,
				[ACTIVITY.SKI_ALPINE_TOUR]: 5,
				[ACTIVITY.ALPINE_TOUR]: 33,
				null: 12,
			});
			expect(countBy(result.items.flatMap((item) => item.climbing.reasons))).toEqual({
				missing_sub_activity_classifier: 89,
				description_too_short: 40,
				non_climbing_activity: 32,
				unsupported_activity_scales: 12,
			});
		} finally {
			db.close();
		}
	});
});

function mapSqliteReportToBaseLayerInput(row: HikrSqliteReportRow): HikrOrgPostBaseLayerInput {
	return {
		id: row.id,
		title: row.title,
		regionPathCsv: row.region_path_csv,
		description: row.description,
		tourDate: row.tour_date,
		hikingDifficulty: row.wandern_schwierigkeit,
		alpineTourDifficulty: row.hochtouren_schwierigkeit,
		climbingDifficulty: row.klettern_schwierigkeit,
		snowshoeTourDifficulty: row.schneeschuhtouren_schwierigkeit,
		viaFerrataDifficulty: row.klettersteig_schwierigkeit,
		skiDifficulty: row.ski_schwierigkeit,
		iceClimbingDifficulty: row.eisklettern_schwierigkeit,
		mountainBikeDifficulty: row.mountainbike_schwierigkeit,
	};
}

function countBy<T>(values: T[], getKey: (value: T) => string = String): Record<string, number> {
	return values.reduce<Record<string, number>>((counts, value) => {
		const key = getKey(value);
		counts[key] = (counts[key] ?? 0) + 1;
		return counts;
	}, {});
}
