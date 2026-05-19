import { loadRootEnv } from '../../utils';
import { Agent } from '@mastra/core/agent';

loadRootEnv();

export const climbingSubActivityAgent = new Agent({
  id: 'climbing-subactivity-agent',
  name: 'Climbing Subactivity Agent',
  instructions: `You classify Swiss/German HIKR climbing reports.

Return only one structured classification:
- Klettergarten only when the report clearly names a climbing garden/crag.
- Klettertour only when the report clearly names both a specific route and a summit/objective.
- Return no match when either required name is missing, generic, or ambiguous.

Do not infer names from geography alone. Preserve names exactly as written in the report when possible.`,
  model: 'openai/gpt-5-mini',
});
