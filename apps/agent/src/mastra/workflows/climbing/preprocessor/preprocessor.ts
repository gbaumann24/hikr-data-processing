import {
  ACTIVITY,
  PREPROCESSOR_STATUS,
  normalizeDescription,
  prepareBaseLayer,
  type BaseLayerPreprocessorOutput,
  type HikrPreprocessorInput,
  type ReportBasePreprocessorOutput,
} from '../../baselayer';
import { classifyActivity } from './activity';
import {
  CLIMBING_PREPROCESSOR_SCHEMA_VERSION,
  CLIMBING_SUB_ACTIVITY,
  type ClimbingPreprocessorOutput,
  type ClimbingPreprocessorReason,
  type ClimbingPreprocessorAgentOutput,
  type ClimbingPreprocessorAgentInput,
  type ClimbingPreprocessorAgentRunner,
} from './types';

export async function preprocessHikrReportForClimbing(
  input: HikrPreprocessorInput,
  options: { runClimbingPreprocessorAgent?: ClimbingPreprocessorAgentRunner } = {},
): Promise<ClimbingPreprocessorOutput> {
  const baseLayer = prepareBaseLayer(input);
  return preprocessPreparedBaseLayerForClimbing(input, baseLayer, options);
}

export async function preprocessPreparedBaseLayerForClimbing(
  input: HikrPreprocessorInput,
  baseLayer: BaseLayerPreprocessorOutput,
  options: { runClimbingPreprocessorAgent?: ClimbingPreprocessorAgentRunner } = {},
): Promise<ClimbingPreprocessorOutput> {
  const activityClassification = classifyActivity(baseLayer.difficultyScales);
  const reasons: ClimbingPreprocessorReason[] = [...baseLayer.reasons];
  const base: ReportBasePreprocessorOutput = {
    ...baseLayer.base,
    activity: activityClassification.activity,
  };

  if (activityClassification.unsupportedScales.length > 0) {
    reasons.push('unsupported_activity_scales');
  } else if (activityClassification.unsupportedCombination) {
    reasons.push('unsupported_activity_combination');
  }

  if (baseLayer.isInsufficient) {
    return buildOutput({
      base: { ...base, status: PREPROCESSOR_STATUS.INSUFFICIENT },
      normalizedDescription: baseLayer.normalizedDescription,
      reasons,
    });
  }

  if (reasons.length > 0) {
    return buildOutput({
      base,
      normalizedDescription: baseLayer.normalizedDescription,
      reasons,
    });
  }

  if (activityClassification.activity !== ACTIVITY.CLIMBING) {
    return buildOutput({
      base,
      normalizedDescription: baseLayer.normalizedDescription,
      reasons: ['non_climbing_activity'],
    });
  }

  if (!base.canton) {
    return buildOutput({
      base: { ...base, status: PREPROCESSOR_STATUS.INSUFFICIENT },
      normalizedDescription: baseLayer.normalizedDescription,
      reasons: reasons.includes('missing_canton') ? reasons : [...reasons, 'missing_canton'],
    });
  }

  if (!options.runClimbingPreprocessorAgent) {
    return buildOutput({
      base,
      normalizedDescription: baseLayer.normalizedDescription,
      reasons: ['missing_climbing_preprocessor_agent'],
    });
  }

  const agentInput: ClimbingPreprocessorAgentInput = {
    title: normalizeDescription(input.title),
    description: baseLayer.normalizedDescription,
    canton: base.canton,
  };
  const agentOutput = await options.runClimbingPreprocessorAgent(agentInput);
  const parsedAgentOutput = parseClimbingPreprocessorAgentOutput(agentOutput);

  if (!parsedAgentOutput) {
    return buildOutput({
      base,
      normalizedDescription: baseLayer.normalizedDescription,
      reasons: ['invalid_climbing_preprocessor_agent_output'],
    });
  }

  if (parsedAgentOutput.subActivity === null) {
    return buildOutput({
      base,
      normalizedDescription: baseLayer.normalizedDescription,
      reasons: ['no_climbing_preprocessor_agent_match'],
    });
  }

  if (parsedAgentOutput.subActivity === CLIMBING_SUB_ACTIVITY.CLIMBING_GARDEN) {
    return buildOutput({
      base: {
        ...base,
        status: PREPROCESSOR_STATUS.READY,
        subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_GARDEN,
      },
      normalizedDescription: baseLayer.normalizedDescription,
      reasons: ['ready'],
      climbingGardenBase: {
        reportId: base.reportId,
        name: parsedAgentOutput.name,
      },
    });
  }

  return buildOutput({
    base: {
      ...base,
      status: PREPROCESSOR_STATUS.READY,
      subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR,
    },
    normalizedDescription: baseLayer.normalizedDescription,
    reasons: ['ready'],
    climbingTourBase: {
      reportId: base.reportId,
      schemaVersion: CLIMBING_PREPROCESSOR_SCHEMA_VERSION,
      routeName: parsedAgentOutput.routeName,
      summit: parsedAgentOutput.summit,
    },
  });
}

function parseClimbingPreprocessorAgentOutput(
  agentOutput: unknown,
): ClimbingPreprocessorAgentOutput | null {
  if (!agentOutput || typeof agentOutput !== 'object') {
    return null;
  }

  const record = agentOutput as Record<string, unknown>;

  if (record.subActivity === CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR) {
    const routeName = normalizeRequiredString(record.routeName);
    const summit = normalizeRequiredString(record.summit);

    return routeName && summit
      ? {
          subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR,
          routeName,
          summit,
        }
      : null;
  }

  if (record.subActivity === CLIMBING_SUB_ACTIVITY.CLIMBING_GARDEN) {
    const name = normalizeRequiredString(record.name);

    return name
      ? {
          subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_GARDEN,
          name,
        }
      : null;
  }

  if (record.subActivity === null) {
    return { subActivity: null };
  }

  return null;
}

function buildOutput({
  base,
  normalizedDescription,
  reasons,
  climbingTourBase = null,
  climbingGardenBase = null,
}: {
  base: ReportBasePreprocessorOutput;
  normalizedDescription: string;
  reasons: ClimbingPreprocessorReason[];
  climbingTourBase?: ClimbingPreprocessorOutput['climbingTourBase'];
  climbingGardenBase?: ClimbingPreprocessorOutput['climbingGardenBase'];
}): ClimbingPreprocessorOutput {
  return {
    base,
    climbingTourBase,
    climbingGardenBase,
    normalizedDescription,
    normalizedDescriptionLength: normalizedDescription.length,
    reasons,
  };
}

function normalizeRequiredString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized === '' ? null : normalized;
}
