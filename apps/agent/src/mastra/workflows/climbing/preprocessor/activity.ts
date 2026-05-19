import {
  ACTIVITY,
  HIKR_DIFFICULTY_SCALE,
  extractDifficultyScales,
  type Activity,
  type DifficultyScaleExtraction,
  type HikrDifficultyScale,
  type HikrOrgPostBaseLayerInput,
} from '../../baselayer';

export type ActivityClassification = {
  activity: Activity | null;
  supportedScales: HikrDifficultyScale[];
  unsupportedScales: HikrDifficultyScale[];
  unsupportedCombination: boolean;
};

const SUPPORTED_ACTIVITY_SCALES = new Set<HikrDifficultyScale>([
  HIKR_DIFFICULTY_SCALE.HIKING,
  HIKR_DIFFICULTY_SCALE.CLIMBING,
  HIKR_DIFFICULTY_SCALE.SKI,
  HIKR_DIFFICULTY_SCALE.ALPINE_TOUR,
]);

const SCALE_KEY_ORDER = new Map<HikrDifficultyScale, number>([
  [HIKR_DIFFICULTY_SCALE.HIKING, 0],
  [HIKR_DIFFICULTY_SCALE.CLIMBING, 1],
  [HIKR_DIFFICULTY_SCALE.SKI, 2],
  [HIKR_DIFFICULTY_SCALE.ALPINE_TOUR, 3],
  [HIKR_DIFFICULTY_SCALE.SNOWSHOE_TOUR, 4],
  [HIKR_DIFFICULTY_SCALE.VIA_FERRATA, 5],
  [HIKR_DIFFICULTY_SCALE.ICE_CLIMBING, 6],
  [HIKR_DIFFICULTY_SCALE.MOUNTAIN_BIKE, 7],
]);

const ACTIVITY_BY_SCALE_SET = new Map<string, Activity>([
  [scaleKey(HIKR_DIFFICULTY_SCALE.CLIMBING), ACTIVITY.CLIMBING],
  [scaleKey(HIKR_DIFFICULTY_SCALE.HIKING, HIKR_DIFFICULTY_SCALE.CLIMBING), ACTIVITY.CLIMBING],
  [scaleKey(HIKR_DIFFICULTY_SCALE.SKI), ACTIVITY.SKI_TOUR],
  [scaleKey(HIKR_DIFFICULTY_SCALE.HIKING, HIKR_DIFFICULTY_SCALE.SKI), ACTIVITY.SKI_TOUR],
  [scaleKey(HIKR_DIFFICULTY_SCALE.SKI, HIKR_DIFFICULTY_SCALE.ALPINE_TOUR), ACTIVITY.SKI_ALPINE_TOUR],
  [scaleKey(HIKR_DIFFICULTY_SCALE.CLIMBING, HIKR_DIFFICULTY_SCALE.SKI), ACTIVITY.SKI_ALPINE_TOUR],
  [
    scaleKey(
      HIKR_DIFFICULTY_SCALE.CLIMBING,
      HIKR_DIFFICULTY_SCALE.SKI,
      HIKR_DIFFICULTY_SCALE.ALPINE_TOUR,
    ),
    ACTIVITY.SKI_ALPINE_TOUR,
  ],
  [scaleKey(HIKR_DIFFICULTY_SCALE.ALPINE_TOUR), ACTIVITY.ALPINE_TOUR],
  [scaleKey(HIKR_DIFFICULTY_SCALE.CLIMBING, HIKR_DIFFICULTY_SCALE.ALPINE_TOUR), ACTIVITY.ALPINE_TOUR],
  [
    scaleKey(
      HIKR_DIFFICULTY_SCALE.HIKING,
      HIKR_DIFFICULTY_SCALE.CLIMBING,
      HIKR_DIFFICULTY_SCALE.ALPINE_TOUR,
    ),
    ACTIVITY.ALPINE_TOUR,
  ],
  [scaleKey(HIKR_DIFFICULTY_SCALE.HIKING), ACTIVITY.HIKING],
]);

export function classifyActivity(
  input: HikrOrgPostBaseLayerInput | DifficultyScaleExtraction,
): ActivityClassification {
  const difficultyScales = isDifficultyScaleExtraction(input)
    ? input
    : extractDifficultyScales(input);

  const supportedScales = difficultyScales.presentScales.filter((scale) =>
    SUPPORTED_ACTIVITY_SCALES.has(scale),
  );
  const unsupportedScales = difficultyScales.presentScales.filter(
    (scale) => !SUPPORTED_ACTIVITY_SCALES.has(scale),
  );

  if (unsupportedScales.length > 0) {
    return {
      activity: null,
      supportedScales,
      unsupportedScales,
      unsupportedCombination: false,
    };
  }

  const activity = ACTIVITY_BY_SCALE_SET.get(scaleKey(...supportedScales)) ?? null;

  return {
    activity,
    supportedScales,
    unsupportedScales,
    unsupportedCombination: activity === null,
  };
}

function isDifficultyScaleExtraction(value: unknown): value is DifficultyScaleExtraction {
  return Boolean(value && typeof value === 'object' && 'presentScales' in value);
}

function scaleKey(...scales: HikrDifficultyScale[]): string {
  return [...scales]
    .sort((left, right) => (SCALE_KEY_ORDER.get(left) ?? 99) - (SCALE_KEY_ORDER.get(right) ?? 99))
    .join('+');
}
