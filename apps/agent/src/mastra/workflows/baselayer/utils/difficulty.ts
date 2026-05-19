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
  V: '4c/5a',
  'V+': '5b',
  'VI-': '5c',
  VI: '5c/6a',
  'VI+': '6a/6a+',
  'VII-': '6a+',
  VII: '6b/6b+',
  'VII+': '6b+/6c',
  'VIII-': '6c+',
  VIII: '7a',
};

const UNICODE_ROMAN_NUMERALS: Record<string, string> = {
  'Ⅰ': 'I',
  'Ⅱ': 'II',
  'Ⅲ': 'III',
  'Ⅳ': 'IV',
  'Ⅴ': 'V',
  'Ⅵ': 'VI',
  'Ⅶ': 'VII',
  'Ⅷ': 'VIII',
  'Ⅸ': 'IX',
  'Ⅹ': 'X',
  'Ⅺ': 'XI',
  'Ⅻ': 'XII',
  'ⅰ': 'I',
  'ⅱ': 'II',
  'ⅲ': 'III',
  'ⅳ': 'IV',
  'ⅴ': 'V',
  'ⅵ': 'VI',
  'ⅶ': 'VII',
  'ⅷ': 'VIII',
  'ⅸ': 'IX',
  'ⅹ': 'X',
  'ⅺ': 'XI',
  'ⅻ': 'XII',
};

const UIAA_ARABIC_TO_ROMAN_GRADE: Record<string, string> = {
  '1': 'I',
  '2': 'II',
  '3': 'III',
  '3+': 'III+',
  '4-': 'IV-',
  '4': 'IV',
  '4+': 'IV+',
  '5-': 'V-',
  '5': 'V',
  '5+': 'V+',
  '6-': 'VI-',
  '6': 'VI',
  '6+': 'VI+',
  '7-': 'VII-',
  '7': 'VII',
  '7+': 'VII+',
  '8-': 'VIII-',
  '8': 'VIII',
};

function normalizeClimbingDifficultyValue(value: string | null | undefined): string | null {
  const normalized = normalizeDifficultyValue(value);
  if (!normalized) {
    return null;
  }

  return convertUiaaClimbingGradeToFrench(normalized) ?? normalized;
}

export function convertUiaaClimbingGradeToFrench(value: string): string | null {
  const gradeKey = normalizeUiaaGradeKey(value);
  return gradeKey ? (UIAA_TO_FRENCH_CLIMBING_GRADE[gradeKey] ?? null) : null;
}

function normalizeUiaaGradeKey(value: string): string | null {
  const normalized = replaceUnicodeRomanNumerals(value)
    .replace(/[−–—]/g, '-')
    .replace(/^UIAA\s+/i, '')
    .replace(/\s*([+-])\s*$/u, '$1')
    .trim()
    .toUpperCase();

  if (/^[IVX]+[+-]?$/.test(normalized)) {
    return normalized;
  }

  return UIAA_ARABIC_TO_ROMAN_GRADE[normalized] ?? null;
}

function replaceUnicodeRomanNumerals(value: string): string {
  return value.replace(/[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩⅪⅫⅰⅱⅲⅳⅴⅵⅶⅷⅸⅹⅺⅻ]/g, (character) => {
    return UNICODE_ROMAN_NUMERALS[character] ?? character;
  });
}
