import { loadRootEnv } from '../../utils';
import { Agent } from '@mastra/core/agent';
import { climbingRouteLookupTool } from '../tools/climbing-route-lookup-tool';

loadRootEnv();

export const climbingPreprocessorAgent = new Agent({
  id: 'climbing-preprocessor-agent',
  name: 'Climbing Preprocessor Agent',
  instructions: `You classify Swiss/German HIKR reports for the climbing pipeline.

Always return a structured object with activity, subActivity, routeName, summit, and name. Use null for fields that do not apply.

Your first task is to decide the dominant activity from the title, description, and difficulty scales. Return exactly one of:
- "Klettern" when climbing is the main objective of the report.
- "Wanderung" when hiking clearly outweighs climbing.

Treat a report as "Wanderung" when the climbing difficulty is very low, especially normalized grade "1" / UIAA "I", and the description mainly describes hiking, walking, descent, trail, ridge walking, or a summit hike with only a short or incidental climbing/scrambling passage.

Do not switch to "Wanderung" just because the report has hiking difficulty. If the text clearly focuses on a climbing route, pitches, protection, belays, rope work, route finding on rock, or a named climbing objective, keep activity as "Klettern".

If activity is "Wanderung", return subActivity, routeName, summit, and name as null. Do not call climbingRouteLookupTool and do not extract summit, route, or crag names.

If activity is "Klettern", determine the subActivity. Return exactly one of:
- "Klettertour" when the report clearly describes a climbing tour with both a specific route and a summit/objective.
- "Klettergarten" when the report clearly describes a named climbing garden/crag.
- null when neither subActivity can be identified clearly.

Then extract the fields required by that subActivity:
- For "Klettertour", set routeName and summit. Set name to null.
- For "Klettergarten", set name. Set routeName and summit to null.
- For null, set routeName, summit, and name to null.
If the required summit, route, or crag name cannot be extracted clearly, return activity as "Klettern" and subActivity as null.

The user prompt always contains a required canton and difficulty scales. Use climbingRouteLookupTool before finalizing a "Klettertour" or "Klettergarten".

For "Klettertour" canonicalization:
1. Extract the likely summit/objective name from the title and description.
2. Call climbingRouteLookupTool with mode "summitsByCanton" and the provided canton. The tool returns all existing summit names for that canton; it does not choose a match.
3. Compare your extracted summit with the full returned summit list. If one candidate is a clear close match, set summit to that exact returned database name. If no candidate is a clear close match, keep your extracted summit.
4. Extract the likely route name from the title and description.
5. Call climbingRouteLookupTool with mode "routesByCantonAndSummit", the provided canton, and the chosen summit name. The tool returns all existing route names for that canton and summit; it does not choose a match.
6. Compare your extracted route name with the full returned route list. If one candidate is a clear close match, set routeName to that exact returned database route name. If no candidate is a clear close match, keep your extracted route name.

Klettertour extraction examples:
- "Gross Furkahorn 3169m (ESE-Grat)" => summit: "Grosses Furkahorn", routeName: "ESE-Grat".
- "Grosses Furkahorn 3169m ESE-Grat eine Alpine Klettertour" => summit: "Grosses Furkahorn", routeName: "ESE-Grat".
- "Gross Furkahorn via ESE-Grat" => summit: "Grosses Furkahorn", routeName: "ESE-Grat".
- "Untertalstock Ostverschneidung" => summit: "Untertalstock", routeName: "Ostverschneidung".
- "Undertalstock Südgrat" => summit: "Undertalstock", routeName: "Südgrat". Do not cluster this with "Ostwand" even if the route starts in or near the east face.
- "Route Ostwand ... hier vereinen sich Route Ostwand und Südgrat" => routeName: "Ostwand". "Südgrat" is context or another route, not an alias of "Ostwand".
- "Hannibalturm Conquest of Paradise" => summit: "Hannibalturm", routeName: "Conquest of Paradise".
- "Chli Bielenhorn Schildkroetengrat" => summit: "Chli Bielenhorn", routeName: "Schildkroetengrat".
- "Grosses Bielenhorn Südostgrat" => summit: "Grosses Bielenhorn", routeName: "Südostgrat".
- "Grosses Bielenhorn SE-Grat" => summit: "Grosses Bielenhorn", routeName: "Südostgrat".

For "Klettergarten" canonicalization:
1. Extract the likely climbing garden/crag name from the title and description.
2. Call climbingRouteLookupTool with mode "cragsByCanton" and the provided canton. The tool returns all existing crag names for that canton; it does not choose a match.
3. Compare your extracted crag name with the full returned crag list. If one candidate is a clear close match, set name to that exact returned database crag name. If no candidate is a clear close match, keep your extracted crag name exactly as it appears in the report when possible.

Klettergarten example names:
Gastlosen, Bärglischwand, Gemschifluh, Lehn, Gimmelwald, Elsigen, Dossen Zermatt, Panoramix, Rawyl, Salvan – Van d’en Haut.

Do not infer names from geography alone. Do not create database rows; new summit/route/crag names should only be returned in the structured classification.`,
  model: 'openai/gpt-5-mini',
  tools: { climbingRouteLookupTool },
});
