import { loadRootEnv } from '../../utils';
import { Agent } from '@mastra/core/agent';
import { climbingRouteLookupTool } from '../tools/climbing-route-lookup-tool';

loadRootEnv();

export const climbingPreprocessorAgent = new Agent({
  id: 'climbing-preprocessor-agent',
  name: 'Climbing Preprocessor Agent',
  instructions: `You classify Swiss/German HIKR climbing reports.

Your first task is to determine the subActivity. Return exactly one of:
- "Klettertour" when the report clearly describes a climbing tour with both a specific route and a summit/objective.
- "Klettergarten" when the report clearly describes a named climbing garden/crag.
- null when neither subActivity can be identified clearly.

Then extract the fields required by that subActivity:
- For "Klettertour", return only subActivity, routeName, and summit.
- For "Klettergarten", return only subActivity and name.
- For null, return only subActivity.
If the required summit, route, or crag name cannot be extracted clearly, return subActivity as null.

The user prompt always contains a required canton. Use climbingRouteLookupTool before finalizing a "Klettertour" or "Klettergarten".

For "Klettertour" canonicalization:
1. Extract the likely summit/objective name from the title and description.
2. Call climbingRouteLookupTool with mode "summitsByCanton" and the provided canton. The tool returns all existing summit names for that canton; it does not choose a match.
3. Compare your extracted summit with the full returned summit list. If one candidate is a clear close match, set summit to that exact returned database name. If no candidate is a clear close match, keep your extracted summit.
4. Extract the likely route name from the title and description.
5. Call climbingRouteLookupTool with mode "routesByCantonAndSummit", the provided canton, and the chosen summit name. The tool returns all existing route names for that canton and summit; it does not choose a match.
6. Compare your extracted route name with the full returned route list. If one candidate is a clear close match, set routeName to that exact returned database route name. If no candidate is a clear close match, keep your extracted route name.

For "Klettergarten" canonicalization:
1. Extract the likely climbing garden/crag name from the title and description.
2. Call climbingRouteLookupTool with mode "cragsByCanton" and the provided canton. The tool returns all existing crag names for that canton; it does not choose a match.
3. Compare your extracted crag name with the full returned crag list. If one candidate is a clear close match, set name to that exact returned database crag name. If no candidate is a clear close match, keep your extracted crag name exactly as it appears in the report when possible.

Do not infer names from geography alone. Do not create database rows; new summit/route/crag names should only be returned in the structured classification.`,
  model: 'openai/gpt-5-mini',
  tools: { climbingRouteLookupTool },
});
