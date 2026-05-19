export const MIN_DESCRIPTION_LENGTH = 1750;

export const PREPROCESSOR_STATUS = {
  READY: 'ready',
  SKIPPED: 'skipped',
  INSUFFICIENT: 'insufficient',
} as const;

export type PreprocessorStatus = (typeof PREPROCESSOR_STATUS)[keyof typeof PREPROCESSOR_STATUS];

export const ACTIVITY = {
  CLIMBING: 'Klettern',
  SKI_TOUR: 'Skitour',
  SKI_ALPINE_TOUR: 'Skihochtour',
  ALPINE_TOUR: 'Hochtour',
  HIKING: 'Wanderung',
} as const;

export type Activity = (typeof ACTIVITY)[keyof typeof ACTIVITY];

export const HIKR_DIFFICULTY_SCALE = {
  HIKING: 'wandern',
  ALPINE_TOUR: 'hochtouren',
  CLIMBING: 'klettern',
  SNOWSHOE_TOUR: 'schneeschuh',
  VIA_FERRATA: 'klettersteig',
  SKI: 'ski',
  ICE_CLIMBING: 'eisklettern',
  MOUNTAIN_BIKE: 'mountainbike',
} as const;

export type HikrDifficultyScale =
  (typeof HIKR_DIFFICULTY_SCALE)[keyof typeof HIKR_DIFFICULTY_SCALE];

export const CLIMBING_PREPROCESSOR_SCHEMA_VERSION = 'climbing-preprocessor-v1';

export const CLIMBING_SUB_ACTIVITY = {
  CLIMBING_TOUR: 'Klettertour',
  CLIMBING_GARDEN: 'Klettergarten',
} as const;

export type ClimbingSubActivity =
  (typeof CLIMBING_SUB_ACTIVITY)[keyof typeof CLIMBING_SUB_ACTIVITY];
