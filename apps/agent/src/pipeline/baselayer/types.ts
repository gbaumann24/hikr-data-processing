export const MIN_DESCRIPTION_LENGTH = 1750;

export const PREPROCESSOR_STATUS = {
  READY: 'ready',
  SKIPPED: 'skipped',
  INSUFFICIENT: 'insufficient',
} as const;

// skipped = later handled by another processor; insufficient = will not be processed again.
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

export type HikrTourDate = Date | string | null;
export type HikrReportIdInput = bigint | number | string;

export type HikrPreprocessorInput = {
  reportId: HikrReportIdInput;
  title?: string | null;
  regionPathCsv?: string | null;
  description?: string | null;
  tourDate?: HikrTourDate;
  hikingDifficulty?: string | null;
  alpineTourDifficulty?: string | null;
  climbingDifficulty?: string | null;
  snowshoeTourDifficulty?: string | null;
  viaFerrataDifficulty?: string | null;
  skiDifficulty?: string | null;
  iceClimbingDifficulty?: string | null;
  mountainBikeDifficulty?: string | null;
};

export type HikrOrgPostBaseLayerInput = Omit<HikrPreprocessorInput, 'reportId'> & {
  id: HikrReportIdInput;
};

export type DifficultyScaleExtraction = {
  presentScales: HikrDifficultyScale[];
  valuesByScale: Partial<Record<HikrDifficultyScale, string>>;
};

export type ReportBasePreprocessorOutput = {
  reportId: bigint;
  status: PreprocessorStatus;
  activity: Activity | null;
  subActivity: string | null;
  canton: string | null;
  tourDate: HikrTourDate;
  region: string | null;
};

export type ReportBaseSchemaWriteInput = {
  reportId: bigint;
  status: PreprocessorStatus;
  activity: Activity | null;
  subActivity: string | null;
  canton: string | null;
  tourDate: Date | null;
  region: string | null;
};

export type BaseLayerPreprocessorReason = 'description_too_short' | 'missing_canton';

export type BaseLayerPreprocessorOutput = {
  base: ReportBasePreprocessorOutput;
  difficultyScales: DifficultyScaleExtraction;
  normalizedDescription: string;
  normalizedDescriptionLength: number;
  reasons: BaseLayerPreprocessorReason[];
  isInsufficient: boolean;
};
