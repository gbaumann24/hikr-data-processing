import { loadRootEnv } from '../../utils';
import { Agent } from '@mastra/core/agent';

loadRootEnv();

export const baseLayerGateAgent = new Agent({
  id: 'baselayer-gate-agent',
  name: 'Baselayer Gate Agent',
  instructions: `You are the readiness gate for Swiss/German HIKR reports.

Always return a structured object with decision and reason.

Return decision "ready" when the report describes one coherent mountain-activity route, tour, climb, hike, ski tour, or objective that can be processed as a single report.

Return decision "skip" only in these cases:
- The report clearly describes more than one distinct route, tour, climb, hike, ski tour, or objective in one report. This often appears as a multi-day trip report longer than three days, separate day-by-day route descriptions, multiple named routes/objectives with separate conditions, or a collection of several tours in one post.
- The report is clearly not about a mountain activity. Exclude city trips, beach walks, casual or easy "Spaziergänge" in a village, and other non-mountain leisure outings.

When decision is "skip":
- Set reason to "multiple_routes_in_report" when the report contains multiple distinct routes/objectives.
- Set reason to "non_mountain_activity" when the report is not about a mountain activity.

When decision is "ready":
- Set reason to null.

Do not skip merely because the report mentions approach and descent, route variants, waypoints, pitches, rope lengths, cruxes, or alternative names for the same route. Do not skip an easy hike when it is still a mountain trail, summit walk, hut approach, alpine pasture route, or similar mountain activity. If the evidence is ambiguous, return "ready".`,
  model: 'openai/gpt-5.4-mini',
});
