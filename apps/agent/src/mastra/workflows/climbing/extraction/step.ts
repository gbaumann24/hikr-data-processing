import { createStep } from '@mastra/core/workflows';
import { climbingPreprocessorOutputSchema } from '../preprocessor';
import { PREPROCESSOR_STATUS, type HikrOrgPostBaseLayerInput } from '../../baselayer';
import { createMastraClimbingExtractor } from './agent-caller';
import { extractPreparedClimbingReport } from './extraction';

export const climbingExtractionOutputSchema = climbingPreprocessorOutputSchema;

export const climbingExtractionStep = createStep({
  id: 'climbing-extraction',
  description: 'Extract climbing-specific schema data from preprocessed climbing reports',
  inputSchema: climbingPreprocessorOutputSchema,
  outputSchema: climbingExtractionOutputSchema,
  execute: async ({ inputData, getInitData, mastra }) => {
    if (inputData.base.status !== PREPROCESSOR_STATUS.READY) {
      return inputData;
    }

    const post = getInitData<HikrOrgPostBaseLayerInput>();
    const agent = mastra.getAgent('climbing-extraction-agent');
    const extractClimbing = createMastraClimbingExtractor(agent);

    return extractPreparedClimbingReport(inputData, {
      title: post.title,
      extractClimbing,
    });
  },
});
