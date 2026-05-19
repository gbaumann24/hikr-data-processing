import { describe, expect, test } from 'bun:test';
import {
  HIKR_DIFFICULTY_SCALE,
  prepareBaseLayer,
  type HikrPreprocessorInput,
} from '../src/mastra/workflows/baselayer';

const longDescription = 'Baselayer Bericht '.repeat(150);

function baseInput(overrides: Partial<HikrPreprocessorInput> = {}): HikrPreprocessorInput {
  return {
    reportId: 42,
    regionPathCsv: 'Welt, Schweiz, Obwalden, Melchtal',
    description: longDescription,
    ...overrides,
  };
}

function climbingGrade(climbingDifficulty: string | null): string | undefined {
  return prepareBaseLayer(baseInput({ climbingDifficulty })).difficultyScales.valuesByScale[
    HIKR_DIFFICULTY_SCALE.CLIMBING
  ];
}

describe('baselayer preprocessor', () => {
  test('converts UIAA climbing grades to French grades', () => {
    expect(climbingGrade('V- (UIAA-Skala)')).toBe('4c');
    expect(climbingGrade('VI+ (UIAA-Skala)')).toBe('6a+');
    expect(climbingGrade('XI+ (UIAA-Skala)')).toBe('9a');
    expect(climbingGrade('vi')).toBe('6a');
  });

  test('keeps existing French climbing grades unchanged', () => {
    expect(climbingGrade('5a')).toBe('5a');
    expect(climbingGrade('6b+')).toBe('6b+');
  });

  test('does not convert UIAA-like values on non-climbing scales', () => {
    const result = prepareBaseLayer(
      baseInput({
        alpineTourDifficulty: 'VI+',
        climbingDifficulty: null,
      }),
    );

    expect(result.difficultyScales.valuesByScale[HIKR_DIFFICULTY_SCALE.ALPINE_TOUR]).toBe('VI+');
  });
});
