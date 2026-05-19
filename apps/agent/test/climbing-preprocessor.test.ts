import { describe, expect, test } from 'bun:test';
import {
	PREPROCESSOR_STATUS,
	normalizeDescription,
	parseRegionPath,
	type HikrOrgPostBaseLayerInput,
} from '../src/mastra/workflows/baselayer';
import {
	CLIMBING_SUB_ACTIVITY,
	classifyActivity,
	preprocessHikrReportForClimbing,
	type ClimbingPreprocessorAgentInput,
} from '../src/mastra/workflows/climbing';

const longDescription = 'Kletterbericht '.repeat(150);

function baseInput(
	overrides: Partial<HikrOrgPostBaseLayerInput> = {},
): HikrOrgPostBaseLayerInput {
	return {
		id: 42n,
		title: 'Gross Turm - Südgrat',
		regionPathCsv: 'Welt, Schweiz, Obwalden, Melchtal',
		description: longDescription,
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
		expect(classifyActivity(baseInput({ hikingDifficulty: null, climbingDifficulty: null, skiDifficulty: 'ZS' })).activity).toBe('Skitour');
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
					subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR,
					routeName: 'Südgrat',
					summit: 'Gross Turm',
				}),
			},
		);

		expect(mountainBikeResult.base.status).toBe(PREPROCESSOR_STATUS.SKIPPED);
		expect(mountainBikeResult.base.activity).toBeNull();
		expect(mountainBikeResult.reasons).toEqual(['unsupported_activity_scales']);
	});

	test('returns insufficient when description is too short', async () => {
		const result = await preprocessHikrReportForClimbing(baseInput({ description: 'zu kurz' }));

		expect(result.base.status).toBe(PREPROCESSOR_STATUS.INSUFFICIENT);
		expect(result.reasons).toContain('description_too_short');
	});

	test('returns insufficient when canton is missing', async () => {
		const result = await preprocessHikrReportForClimbing(baseInput({ regionPathCsv: 'Welt, Frankreich, Haute-Savoie' }));

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
	});

	test('sets climbing tour output when preprocessor agent returns route and summit', async () => {
		const agentInputs: ClimbingPreprocessorAgentInput[] = [];
		const result = await preprocessHikrReportForClimbing(baseInput(), {
			runClimbingPreprocessorAgent: async (input) => {
				agentInputs.push(input);
				return {
					subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR,
					routeName: 'Südgrat',
					summit: 'Gross Turm',
				};
			},
		});

		expect(result.base.status).toBe(PREPROCESSOR_STATUS.READY);
		expect(result.base.subActivity).toBe(CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR);
		expect(agentInputs).toMatchObject([{ canton: 'Obwalden' }]);
		expect(result.climbingTourBase).toMatchObject({
			routeName: 'Südgrat',
			summit: 'Gross Turm',
		});
		expect(result.climbingGardenBase).toBeNull();
	});

	test('sets climbing garden output when preprocessor agent returns a climbing garden', async () => {
		const result = await preprocessHikrReportForClimbing(baseInput(), {
			runClimbingPreprocessorAgent: async () => ({
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

	test('skips when preprocessor agent cannot produce a valid output', async () => {
		const result = await preprocessHikrReportForClimbing(baseInput(), {
			runClimbingPreprocessorAgent: async () => null,
		});

		expect(result.base.status).toBe(PREPROCESSOR_STATUS.SKIPPED);
		expect(result.reasons).toEqual(['invalid_climbing_preprocessor_agent_output']);
	});

	test('skips when preprocessor agent finds no climbing sub-activity', async () => {
		const result = await preprocessHikrReportForClimbing(baseInput(), {
			runClimbingPreprocessorAgent: async () => ({
				subActivity: null,
			}),
		});

		expect(result.base.status).toBe(PREPROCESSOR_STATUS.SKIPPED);
		expect(result.reasons).toEqual(['no_climbing_preprocessor_agent_match']);
	});
});
