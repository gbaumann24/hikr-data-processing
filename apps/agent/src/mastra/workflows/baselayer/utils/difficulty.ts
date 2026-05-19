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
  normalize?: (value: string | null | undefined) => string | null;
}> = [
  { scale: HIKR_DIFFICULTY_SCALE.HIKING, getValue: (input) => input.hikingDifficulty },
  { scale: HIKR_DIFFICULTY_SCALE.ALPINE_TOUR, getValue: (input) => input.alpineTourDifficulty },
  {
    scale: HIKR_DIFFICULTY_SCALE.CLIMBING,
    getValue: (input) => input.climbingDifficulty,
    normalize: normalizeClimbingDifficultyValue,
  },
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
    const value = field.normalize
      ? field.normalize(field.getValue(input))
      : normalizeDifficultyValue(field.getValue(input));
    if (value) {
      presentScales.push(field.scale);
      valuesByScale[field.scale] = value;
    }
  }

  return { presentScales, valuesByScale };
}

const UIAA_TO_FRENCH_CLIMBING_GRADE: Record<string, string> = {
  I: '1',
  II: '2',
  III: '3a',
  'III+': '3b',
  'IV-': '3c',
  IV: '4a',
  'IV+': '4b',
  'V-': '4c',
  V: '5a',
  'V+': '5b',
  'VI-': '5c',
  VI: '6a',
  'VI+': '6a+',
  'VII-': '6b',
  VII: '6b+',
  'VII+': '6c',
  'VIII-': '7a',
  VIII: '7a+',
  'VIII+': '7b',
  'IX-': '7c',
  IX: '7c+',
  'IX+': '8a',
  'X-': '8a+',
  X: '8b',
  'X+': '8b+',
  'XI-': '8c',
  XI: '8c+',
  'XI+': '9a',
};

function normalizeClimbingDifficultyValue(value: string | null | undefined): string | null {
  const normalized = normalizeDifficultyValue(value);
  if (!normalized) {
    return null;
  }

  const uiaaGrade = normalized
    .replace(/\s*\(\s*UIAA\s*[-–—]\s*Skala\s*\)\s*$/i, '')
    .trim()
    .toUpperCase();

  return UIAA_TO_FRENCH_CLIMBING_GRADE[uiaaGrade] ?? normalized;
}
