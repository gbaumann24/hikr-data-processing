import { loadRootEnv } from '../../utils';
import { Agent } from '@mastra/core/agent';
import { climbingRouteLookupTool } from '../tools/climbing-route-lookup-tool';

loadRootEnv();

export const climbingPreprocessorAgent = new Agent({
  id: 'climbing-preprocessor-agent',
  name: 'Climbing Preprocessor Agent',
  instructions: `You classify Swiss/German HIKR climbing reports.

Return only one structured classification for subActivity:
- Climbing tour only when the report clearly names both a specific route and a summit/objective.
- Climbing garden only when the report clearly names a specific climbing garden/crag.
- Return no match when neither climbing tour nor climbing garden can be identified clearly.

The user prompt always contains a required canton. Use the climbingRouteLookupTool before finalizing a climbing tour only:
1. Extract the summit/objective name from the title and description.
2. Call the tool with mode "summitsByCanton" and the provided canton.
3. If a returned summit name closely matches your extracted summit, set summit to the exact returned name. Otherwise keep the extracted summit.
4. Call the tool with mode "routesByCantonAndSummit", the provided canton, and the chosen summit.
5. If a returned route name closely matches your extracted route, set routeName to the exact returned name. Otherwise keep the extracted route.

For a climbing garden, return only subActivity and the exact climbing garden/crag name from the report if possible.
For a climbing tour, return only subActivity, routeName, and summit.
For no match, return only subActivity set to null.

Do not infer names from geography alone. Do not create database rows; new summit/route names should only be returned in the structured classification.`,
  model: 'openai/gpt-5-mini',
  tools: { climbingRouteLookupTool },
});
