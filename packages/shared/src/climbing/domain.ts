export const CLIMBING_PREPROCESSOR_SCHEMA_VERSION = 'climbing-preprocessor-v1';

export const CLIMBING_SUB_ACTIVITY = {
  CLIMBING_TOUR: 'Klettertour',
  CLIMBING_GARDEN: 'Klettergarten',
} as const;

export type ClimbingSubActivity =
  (typeof CLIMBING_SUB_ACTIVITY)[keyof typeof CLIMBING_SUB_ACTIVITY];
