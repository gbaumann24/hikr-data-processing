import { loadRootEnv } from '../../utils';
import { Agent } from '@mastra/core/agent';

loadRootEnv();

export const baseLayerGateAgent = new Agent({
  id: 'baselayer-gate-agent',
  name: 'Baselayer Gate Agent',
  instructions: `You are the readiness gate for Swiss/German HIKR reports.

Always return a structured object with decision and reason.

Return decision "ready" when the report describes one coherent route, tour, climb, hike, ski tour, or objective that can be processed as a single report.

Return decision "skip" only when the report clearly describes more than one distinct route, tour, climb, hike, ski tour, or objective in one report. This often appears as a multi-day trip report longer than three days, separate day-by-day route descriptions, multiple named routes/objectives with separate conditions, or a collection of several tours in one post.

When decision is "skip":
- Set reason to "multiple_routes_in_report".

When decision is "ready":
- Set reason to null.

Do not skip merely because the report mentions approach and descent, route variants, waypoints, pitches, rope lengths, cruxes, or alternative names for the same route. If the evidence is ambiguous, return "ready".`,
  model: 'openai/gpt-5.4-mini',
});
