import {
  BASELAYER_GATE_DECISION,
  PREPROCESSOR_STATUS,
  type BaseLayerGateOutput,
  type BaseLayerGateReason,
  type BaseLayerPreprocessorOutput,
  type HikrOrgPostBaseLayerInput,
  type ReportBasePreprocessorOutput,
} from '../types';
import { normalizeDescription } from '../utils';
import type { BaseLayerGateAgentInput, BaseLayerGateAgentRunner } from './types';

export async function gatePreparedBaseLayer(
  input: HikrOrgPostBaseLayerInput,
  baseLayer: BaseLayerPreprocessorOutput,
  options: { runBaseLayerGateAgent?: BaseLayerGateAgentRunner } = {},
): Promise<BaseLayerGateOutput> {
  if (baseLayer.isInsufficient) {
    return buildOutput({
      ...baseLayer,
      reasons: baseLayer.reasons,
    });
  }

  if (!options.runBaseLayerGateAgent) {
    return buildOutput({
      ...baseLayer,
      base: {
        ...baseLayer.base,
        status: PREPROCESSOR_STATUS.SKIPPED,
      },
      reasons: ['missing_baselayer_gate_agent'],
    });
  }

  const agentInput: BaseLayerGateAgentInput = {
    title: normalizeDescription(input.title),
    description: baseLayer.normalizedDescription,
    canton: baseLayer.base.canton,
    region: baseLayer.base.region,
    tourDate: normalizeDateForPrompt(input.tourDate),
    difficultyScales: baseLayer.difficultyScales.presentScales.map((scale) => ({
      scale,
      value: baseLayer.difficultyScales.valuesByScale[scale] ?? '',
    })),
  };
  const agentOutput = await options.runBaseLayerGateAgent(agentInput);

  if (agentOutput.decision === BASELAYER_GATE_DECISION.READY) {
    return buildOutput({
      ...baseLayer,
      base: {
        ...baseLayer.base,
        status: PREPROCESSOR_STATUS.READY,
      },
      reasons: [],
    });
  }

  return buildOutput({
    ...baseLayer,
    base: {
      ...baseLayer.base,
      status: PREPROCESSOR_STATUS.SKIPPED,
    },
    reasons: [agentOutput.reason],
  });
}

function buildOutput({
  base,
  difficultyScales,
  normalizedDescription,
  normalizedDescriptionLength,
  reasons,
  isInsufficient,
}: {
  base: ReportBasePreprocessorOutput;
  difficultyScales: BaseLayerPreprocessorOutput['difficultyScales'];
  normalizedDescription: string;
  normalizedDescriptionLength: number;
  reasons: BaseLayerGateReason[];
  isInsufficient: boolean;
}): BaseLayerGateOutput {
  return {
    base,
    difficultyScales,
    normalizedDescription,
    normalizedDescriptionLength,
    reasons,
    isInsufficient,
  };
}

function normalizeDateForPrompt(value: HikrOrgPostBaseLayerInput['tourDate']): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value);
}
