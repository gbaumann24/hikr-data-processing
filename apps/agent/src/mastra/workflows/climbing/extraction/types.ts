import type { ClimbingPreprocessorOutput } from '../preprocessor';

export const CLIMBING_EXTRACTION_SCHEMA_VERSION = 'climbing-extraction-v1';

export const climbingExtractionAgentResultSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['schemaVersion'],
  properties: {
    schemaVersion: { enum: [CLIMBING_EXTRACTION_SCHEMA_VERSION] },
  },
} as const;

export type ClimbingExtractionAgentResult = {
  schemaVersion: typeof CLIMBING_EXTRACTION_SCHEMA_VERSION;
};

export type ClimbingExtractorInput = {
  title: string | null;
  preprocessed: ClimbingPreprocessorOutput;
};

export type ClimbingExtractor = (
  input: ClimbingExtractorInput,
) => Promise<ClimbingExtractionAgentResult>;
