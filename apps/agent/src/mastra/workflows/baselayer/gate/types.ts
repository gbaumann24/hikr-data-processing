import type { HikrDifficultyScale } from '@hikr/shared';
import { z } from 'zod';
import {
  BASELAYER_GATE_DECISION,
  BASELAYER_GATE_REASON,
  type BaseLayerGateAgentReason,
  type BaseLayerGateDecision,
} from '../types';

export { BASELAYER_GATE_DECISION, BASELAYER_GATE_REASON };
export type { BaseLayerGateAgentReason, BaseLayerGateDecision };

export type BaseLayerGateAgentInput = {
  title: string;
  description: string;
  canton: string | null;
  region: string | null;
  tourDate: string | null;
  difficultyScales: Array<{ scale: HikrDifficultyScale; value: string }>;
};

export const baseLayerGateAgentOutputSchema = z
  .object({
    decision: z.union([
      z.literal(BASELAYER_GATE_DECISION.READY),
      z.literal(BASELAYER_GATE_DECISION.SKIP),
    ]),
    reason: z
      .union([
        z.literal(BASELAYER_GATE_REASON.MULTIPLE_ROUTES_IN_REPORT),
        z.literal(BASELAYER_GATE_REASON.NON_MOUNTAIN_ACTIVITY),
      ])
      .nullable(),
  })
  .strict();

export type BaseLayerGateAgentStructuredOutput = z.infer<typeof baseLayerGateAgentOutputSchema>;

export type BaseLayerGateAgentOutput =
  | {
      decision: typeof BASELAYER_GATE_DECISION.READY;
    }
  | {
      decision: typeof BASELAYER_GATE_DECISION.SKIP;
      reason: BaseLayerGateAgentReason;
    }
  | {
      decision: typeof BASELAYER_GATE_DECISION.SKIP;
      reason: 'invalid_baselayer_gate_agent_output';
    };

export function parseBaseLayerGateAgentOutput(output: unknown): BaseLayerGateAgentOutput {
  const parsedOutput = baseLayerGateAgentOutputSchema.safeParse(output);

  if (!parsedOutput.success) {
    return {
      decision: BASELAYER_GATE_DECISION.SKIP,
      reason: 'invalid_baselayer_gate_agent_output',
    };
  }

  const structuredOutput = parsedOutput.data;

  if (structuredOutput.decision === BASELAYER_GATE_DECISION.READY) {
    return { decision: BASELAYER_GATE_DECISION.READY };
  }

  if (!isBaseLayerGateAgentReason(structuredOutput.reason)) {
    return {
      decision: BASELAYER_GATE_DECISION.SKIP,
      reason: 'invalid_baselayer_gate_agent_output',
    };
  }

  return {
    decision: BASELAYER_GATE_DECISION.SKIP,
    reason: structuredOutput.reason,
  };
}

function isBaseLayerGateAgentReason(reason: unknown): reason is BaseLayerGateAgentReason {
  return (
    reason === BASELAYER_GATE_REASON.MULTIPLE_ROUTES_IN_REPORT ||
    reason === BASELAYER_GATE_REASON.NON_MOUNTAIN_ACTIVITY
  );
}

export type BaseLayerGateAgentRunner = (
  input: BaseLayerGateAgentInput,
) => Promise<BaseLayerGateAgentOutput>;
