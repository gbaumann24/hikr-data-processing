import { describe, expect, test } from 'bun:test';
import { createMastraClimbingTourAggregationSummarizer } from '../src/climbing-aggregation/agent-caller';

describe('climbing tour aggregation agent caller', () => {
  test('returns validated structured output from the Mastra agent', async () => {
    const calls: unknown[] = [];
    const summarize = createMastraClimbingTourAggregationSummarizer({
      generate: async (messages, options) => {
        calls.push({ messages, options });
        return {
          object: {
            text: [
              {
                path: 'zusammenfassung',
                text: 'Die Route bietet kompakte Plattenkletterei.',
              },
            ],
          },
        };
      },
    });

    await expect(
      summarize({
        routeId: '7',
        sourceReportCount: 1,
        deterministicPayload: {},
        text: {},
        gefahrenByTyp: {},
        schluesselstellen: [],
        seillaengenByNummer: {},
        hinweise: [],
      }),
    ).resolves.toEqual({
      text: [
        {
          path: 'zusammenfassung',
          text: 'Die Route bietet kompakte Plattenkletterei.',
        },
      ],
    });
    expect(calls).toHaveLength(1);
  });

  test('rejects invalid structured output', async () => {
    const summarize = createMastraClimbingTourAggregationSummarizer({
      generate: async () => ({
        object: {
          schluesselstellen: [{ beschreibung: 42 }],
        },
      }),
    });

    await expect(
      summarize({
        routeId: '7',
        sourceReportCount: 1,
        deterministicPayload: {},
        text: {},
        gefahrenByTyp: {},
        schluesselstellen: [],
        seillaengenByNummer: {},
        hinweise: [],
      }),
    ).rejects.toThrow('Mastra climbing tour aggregation agent returned invalid structured output');
  });
});
