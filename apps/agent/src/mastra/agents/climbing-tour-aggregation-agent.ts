import { Agent } from '@mastra/core/agent';
import { z } from 'zod';
import { loadRootEnv } from '../../utils';

loadRootEnv();

export const climbingTourAggregationAgentOutputSchema = z
  .object({
    text: z
      .record(z.string(), z.string())
      .optional()
      .describe('Aggregated German present-tense beta summaries keyed by extraction field path.'),
    gefahren_by_typ: z
      .record(z.string(), z.string())
      .optional()
      .describe('Aggregated hazard descriptions keyed by hazard type.'),
    schluesselstellen: z
      .array(
        z
          .object({
            wo: z.string().nullable().optional(),
            beschreibung: z.string(),
            evidence_count: z.number().int().optional(),
          })
          .strict(),
      )
      .optional()
      .describe('Deduplicated crux list for the route.'),
    seillaengen_by_nummer: z
      .record(
        z.string(),
        z
          .object({
            beschreibung: z.string().nullable().optional(),
          })
          .strict(),
      )
      .optional()
      .describe('Aggregated pitch descriptions keyed by pitch number.'),
    hinweise: z
      .array(z.string())
      .optional()
      .describe('Deduplicated or compacted practical notes that do not fit another field.'),
  })
  .strict();

export type ClimbingTourAggregationAgentOutput = z.infer<
  typeof climbingTourAggregationAgentOutputSchema
>;

export const climbingTourAggregationAgent = new Agent({
  id: 'climbing-tour-aggregation-agent',
  name: 'Climbing Tour Aggregation Agent',
  instructions: `You aggregate extracted HIKR alpine climbing report facts into route-level German beta.

You receive all text evidence for one route plus deterministic aggregate statistics. Write compact present-tense information for future parties repeating the route.

Rules:
- Use German climbing terminology and present tense.
- Preserve useful conflicts instead of hiding them: mention when newer or higher-quality reports differ.
- Do not invent facts not present in the provided evidence or deterministic aggregate context.
- Keep each field self-contained and practical. Compact does not mean over-compressed: route-line, rappel, retreat, hazard, pitch, and summary fields may be longer when useful for orientation or safety.
- For the "zusammenfassung" entry in "text", write a useful route-level summary in roughly 2-4 concise sentences: route character, seriousness, access/descent, and the most important practical beta when evidenced.
- Avoid awkward meta wording such as "Keile werden nur vereinzelt erwähnt". Turn frequency information into practical beta only when helpful, e.g. "Einzelne Berichte empfehlen kleine Keile/Friends fuer die groesseren Hakenabstaende im Mittelteil."
- Return only the structured output. Use field paths exactly as provided for the text map.`,
  model: 'openai/gpt-5.4-mini',
});
