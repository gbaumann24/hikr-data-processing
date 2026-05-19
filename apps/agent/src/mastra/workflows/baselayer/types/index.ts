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
  tourDate: HikrOrgPostBaseLayerInput['tourDate'];
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
