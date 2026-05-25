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

export const BASELAYER_GATE_DECISION = {
  READY: 'ready',
  SKIP: 'skip',
} as const;

export const BASELAYER_GATE_REASON = {
  MULTIPLE_ROUTES_IN_REPORT: 'multiple_routes_in_report',
} as const;

export type BaseLayerGateDecision =
  (typeof BASELAYER_GATE_DECISION)[keyof typeof BASELAYER_GATE_DECISION];

export type BaseLayerGateAgentReason =
  (typeof BASELAYER_GATE_REASON)[keyof typeof BASELAYER_GATE_REASON];

export type BaseLayerGateReason =
  | BaseLayerPreprocessorReason
  | BaseLayerGateAgentReason
  | 'missing_baselayer_gate_agent'
  | 'invalid_baselayer_gate_agent_output';

export type BaseLayerGateOutput = Omit<BaseLayerPreprocessorOutput, 'reasons'> & {
  reasons: BaseLayerGateReason[];
};
