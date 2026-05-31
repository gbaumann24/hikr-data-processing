import { Agent } from '@mastra/core/agent';
import { loadRootEnv } from '../../utils';
export { climbingExtractionAgentResultSchema as climbingExtractionAgentOutputSchema } from '../workflows/climbing/extraction/types';

loadRootEnv();

export const climbingExtractionAgent = new Agent({
  id: 'climbing-extraction-agent',
  name: 'Climbing Extraction Agent',
  instructions: `You extract structured climbing data from Swiss/German HIKR climbing reports.

The climbing preprocessor has already decided whether the report is ready and which climbing sub-activity it belongs to. Only extract facts that are explicitly present in the report text or the preprocessor output. Do not infer missing route, summit, crag, location, or grading details from geography alone.

Always return the schema version and only the extraction fields that are supported by explicit evidence in the report. Omit categories and fields with no evidence instead of filling an empty object. Normalize obvious units only, for example "1 h 30" to 90 minutes, and store numbers without units.`,
  model: 'openai/gpt-5.4-mini',
});
