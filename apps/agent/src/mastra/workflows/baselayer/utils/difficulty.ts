import { normalizeDifficultyValue } from './normalization';
import {
  HIKR_DIFFICULTY_SCALE,
  type DifficultyScaleExtraction,
  type HikrDifficultyScale,
  type HikrPreprocessorInput,
} from '../types';

const DIFFICULTY_FIELDS: Array<{
  scale: HikrDifficultyScale;
  getValue: (input: HikrPreprocessorInput) => string | null | undefined;
}> = [
  { scale: HIKR_DIFFICULTY_SCALE.HIKING, getValue: (input) => input.hikingDifficulty },
  { scale: HIKR_DIFFICULTY_SCALE.ALPINE_TOUR, getValue: (input) => input.alpineTourDifficulty },
  { scale: HIKR_DIFFICULTY_SCALE.CLIMBING, getValue: (input) => input.climbingDifficulty },
  { scale: HIKR_DIFFICULTY_SCALE.SNOWSHOE_TOUR, getValue: (input) => input.snowshoeTourDifficulty },
  { scale: HIKR_DIFFICULTY_SCALE.VIA_FERRATA, getValue: (input) => input.viaFerrataDifficulty },
  { scale: HIKR_DIFFICULTY_SCALE.SKI, getValue: (input) => input.skiDifficulty },
  { scale: HIKR_DIFFICULTY_SCALE.ICE_CLIMBING, getValue: (input) => input.iceClimbingDifficulty },
  { scale: HIKR_DIFFICULTY_SCALE.MOUNTAIN_BIKE, getValue: (input) => input.mountainBikeDifficulty },
];

export function extractDifficultyScales(input: HikrPreprocessorInput): DifficultyScaleExtraction {
  const presentScales: HikrDifficultyScale[] = [];
  const valuesByScale: Partial<Record<HikrDifficultyScale, string>> = {};

  for (const field of DIFFICULTY_FIELDS) {
    const value = normalizeDifficultyValue(field.getValue(input));
    if (value) {
      presentScales.push(field.scale);
      valuesByScale[field.scale] = value;
    }
  }

  return { presentScales, valuesByScale };
}
