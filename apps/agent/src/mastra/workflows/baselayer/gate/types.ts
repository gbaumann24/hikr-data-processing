import type { HikrDifficultyScale } from '@hikr/shared';
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

export const baseLayerGateAgentOutputSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['decision', 'reason'],
  properties: {
    decision: {
      enum: [BASELAYER_GATE_DECISION.READY, BASELAYER_GATE_DECISION.SKIP],
    },
    reason: {
      enum: [
        BASELAYER_GATE_REASON.MULTIPLE_ROUTES_IN_REPORT,
        BASELAYER_GATE_REASON.NON_MOUNTAIN_ACTIVITY,
        null,
      ],
    },
  },
} as const;

export type BaseLayerGateAgentStructuredOutput = {
  decision: BaseLayerGateDecision;
  reason: BaseLayerGateAgentReason | null;
};

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
  if (!isBaseLayerGateAgentStructuredOutput(output)) {
    return {
      decision: BASELAYER_GATE_DECISION.SKIP,
      reason: 'invalid_baselayer_gate_agent_output',
    };
  }

  if (output.decision === BASELAYER_GATE_DECISION.READY) {
    return { decision: BASELAYER_GATE_DECISION.READY };
  }

  if (!isBaseLayerGateAgentReason(output.reason)) {
    return {
      decision: BASELAYER_GATE_DECISION.SKIP,
      reason: 'invalid_baselayer_gate_agent_output',
    };
  }

  return {
    decision: BASELAYER_GATE_DECISION.SKIP,
    reason: output.reason,
  };
}

function isBaseLayerGateAgentStructuredOutput(
  output: unknown,
): output is BaseLayerGateAgentStructuredOutput {
  if (typeof output !== 'object' || output === null) {
    return false;
  }

  const candidate = output as Partial<BaseLayerGateAgentStructuredOutput>;

  return (
    (candidate.decision === BASELAYER_GATE_DECISION.READY ||
      candidate.decision === BASELAYER_GATE_DECISION.SKIP) &&
    (isBaseLayerGateAgentReason(candidate.reason) || candidate.reason === null)
  );
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
