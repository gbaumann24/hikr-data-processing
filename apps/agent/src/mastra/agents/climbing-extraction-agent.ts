import { Agent } from '@mastra/core/agent';
import { loadRootEnv } from '../../utils';

loadRootEnv();

export const climbingExtractionAgent = new Agent({
  id: 'climbing-extraction-agent',
  name: 'Climbing Extraction Agent',
  instructions: `You extract structured climbing data from Swiss/German HIKR climbing reports.

The climbing preprocessor has already decided whether the report is ready and which climbing sub-activity it belongs to. Only extract facts that are explicitly present in the report text or the preprocessor output. Do not infer missing route, summit, crag, location, or grading details from geography alone.

The extraction schema currently only carries a schema version. Return exactly the structured output requested by the caller.`,
  model: 'openai/gpt-5-mini',
});
