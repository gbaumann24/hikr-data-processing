import { describe, expect, test } from 'bun:test';
import { zodToJsonSchema } from '@mastra/core/utils/zod-to-json';
import { climbingTourAggregationAgentOutputSchema } from '../src/mastra/agents/climbing-tour-aggregation-agent';

describe('climbing tour aggregation agent', () => {
  test('uses an OpenAI-compatible structured output schema', () => {
    const jsonSchema = zodToJsonSchema(climbingTourAggregationAgentOutputSchema);

    expect(JSON.stringify(jsonSchema)).not.toContain('"propertyNames"');
  });
});
