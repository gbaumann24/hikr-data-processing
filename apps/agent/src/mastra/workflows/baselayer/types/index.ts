import type {
  Activity,
  HikrDifficultyScale,
  HikrOrgPostBaseLayerInput,
  PreprocessorStatus,
  ReportBaseSchemaWriteInput,
} from '@hikr/shared';

export {
  ACTIVITY,
  HIKR_DIFFICULTY_SCALE,
  MIN_DESCRIPTION_LENGTH,
  PREPROCESSOR_STATUS,
} from '@hikr/shared';
export type {
  Activity,
  HikrDifficultyScale,
  HikrOrgPostBaseLayerInput,
  PreprocessorStatus,
  ReportBaseSchemaWriteInput,
} from '@hikr/shared';

type HikrTourDate = Date | string | null;
type HikrReportIdInput = bigint | number | string;

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

export type BaseLayerPreprocessorReason = 'description_too_short' | 'missing_canton';

export type BaseLayerPreprocessorOutput = {
  base: ReportBasePreprocessorOutput;
  difficultyScales: DifficultyScaleExtraction;
  normalizedDescription: string;
  normalizedDescriptionLength: number;
  reasons: BaseLayerPreprocessorReason[];
  isInsufficient: boolean;
};
