import { describe, expect, test } from 'bun:test';
import { ACTIVITY, PREPROCESSOR_STATUS } from '../src/mastra/workflows/baselayer';
import {
  CLIMBING_EXTRACTION_SCHEMA_VERSION,
  CLIMBING_PREPROCESSOR_SCHEMA_VERSION,
  CLIMBING_SUB_ACTIVITY,
  extractPreparedClimbingReport,
  type ClimbingPreprocessorOutput,
} from '../src/mastra/workflows/climbing';

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
      tourDate: '2024-08-10',
      region: 'Melchtal',
    },
    climbingTourBase: {
      reportId: 42n,
      schemaVersion: CLIMBING_PREPROCESSOR_SCHEMA_VERSION,
      routeName: 'Sudgrat',
      summit: 'Gross Turm',
    },
    climbingGardenBase: null,
    normalizedDescription: 'Kletterbericht '.repeat(150),
    normalizedDescriptionLength: 'Kletterbericht '.repeat(150).length,
    reasons: ['ready'],
    ...overrides,
  };
}

describe('climbing extraction scaffold', () => {
  test('runs extraction for ready climbing preprocessor output', async () => {
    const input = climbingOutput();
    const calls: unknown[] = [];

    const result = await extractPreparedClimbingReport(input, {
      title: 'Gross Turm - Sudgrat',
      extractClimbing: async (extractorInput) => {
        calls.push(extractorInput);
        return { schemaVersion: CLIMBING_EXTRACTION_SCHEMA_VERSION };
      },
    });

    expect(result).toBe(input);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      title: 'Gross Turm - Sudgrat',
      preprocessed: input,
    });
  });

  test('does not run extraction for non-ready preprocessor output', async () => {
    const input = climbingOutput({
      base: {
        ...climbingOutput().base,
        status: PREPROCESSOR_STATUS.SKIPPED,
        subActivity: null,
      },
      climbingTourBase: null,
      reasons: ['non_climbing_activity'],
    });
    let callCount = 0;

    const result = await extractPreparedClimbingReport(input, {
      title: 'Gross Turm - Sudgrat',
      extractClimbing: async () => {
        callCount += 1;
        return { schemaVersion: CLIMBING_EXTRACTION_SCHEMA_VERSION };
      },
    });

    expect(result).toBe(input);
    expect(callCount).toBe(0);
  });
});
