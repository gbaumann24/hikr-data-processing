import type { ClimbingTourAggregationReportRecord } from '@hikr/db';
import type { ClimbingTourAggregationAgentOutput } from 'agent/mastra/agents/climbing-tour-aggregation-agent';

export const CLIMBING_TOUR_AGGREGATION_SCHEMA_VERSION = 'climbing-tour-aggregation-v1';
export const SINGLE_REPORT_COMPLETENESS_THRESHOLD = 0.8;

export type ClimbingTourAggregationReport = ClimbingTourAggregationReportRecord;

export type TextEvidenceItem = {
  reportId: string;
  tourDate: string | null;
  qualityScore: number | null;
  text: string;
};

export type HazardTextEvidenceItem = TextEvidenceItem & {
  typ: string;
};

export type CruxTextEvidenceItem = Omit<TextEvidenceItem, 'text'> & {
  wo: string | null;
  beschreibung: string;
};

export type PitchTextEvidenceItem = Omit<TextEvidenceItem, 'text'> & {
  nummer: number;
  beschreibung: string;
};

export type ClimbingTourAggregationAgentInput = {
  routeId: string;
  sourceReportCount: number;
  deterministicPayload: unknown;
  text: Record<string, TextEvidenceItem[]>;
  gefahrenByTyp: Record<string, HazardTextEvidenceItem[]>;
  schluesselstellen: CruxTextEvidenceItem[];
  seillaengenByNummer: Record<string, PitchTextEvidenceItem[]>;
  hinweise: TextEvidenceItem[];
};

export type ClimbingTourAggregationSummarizer = (
  input: ClimbingTourAggregationAgentInput,
) => Promise<ClimbingTourAggregationAgentOutput>;

export type DeterministicAggregationResult = {
  payload: Record<string, unknown>;
  agentInput: ClimbingTourAggregationAgentInput;
};
