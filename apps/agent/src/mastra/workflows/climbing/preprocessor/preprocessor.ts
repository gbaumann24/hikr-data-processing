import {
  ACTIVITY,
  PREPROCESSOR_STATUS,
  normalizeDescription,
  prepareBaseLayer,
  type BaseLayerPreprocessorOutput,
  type HikrOrgPostBaseLayerInput,
  type ReportBasePreprocessorOutput,
} from '../../baselayer';
import { classifyActivity } from './activity';
import {
  CLIMBING_PREPROCESSOR_SCHEMA_VERSION,
  CLIMBING_SUB_ACTIVITY,
  type ClimbingPreprocessorAgentInput,
  type ClimbingPreprocessorAgentRunner,
  type ClimbingPreprocessorOutput,
  type ClimbingPreprocessorReason,
} from './types';

export async function preprocessHikrReportForClimbing(
  input: HikrOrgPostBaseLayerInput,
  options: { runClimbingPreprocessorAgent?: ClimbingPreprocessorAgentRunner } = {},
): Promise<ClimbingPreprocessorOutput> {
  const baseLayer = prepareBaseLayer(input);
  return preprocessPreparedBaseLayerForClimbing(input, baseLayer, options);
}

export async function preprocessPreparedBaseLayerForClimbing(
  input: HikrOrgPostBaseLayerInput,
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
    difficultyScales: activityClassification.supportedScales.map((scale) => ({
      scale,
      value: baseLayer.difficultyScales.valuesByScale[scale] ?? '',
    })),
    hikrWaypointNames: extractHikrWaypointNames(input),
  };
  const agentOutput = await options.runClimbingPreprocessorAgent(agentInput);

  if (agentOutput.activity === ACTIVITY.HIKING) {
    return buildOutput({
      base: {
        ...base,
        activity: ACTIVITY.HIKING,
        status: PREPROCESSOR_STATUS.SKIPPED,
        subActivity: null,
      },
      normalizedDescription: baseLayer.normalizedDescription,
      reasons: ['non_climbing_activity'],
    });
  }

  if (agentOutput.subActivity === null) {
    return buildOutput({
      base,
      normalizedDescription: baseLayer.normalizedDescription,
      reasons: ['no_climbing_preprocessor_agent_match'],
    });
  }

  if (agentOutput.subActivity === CLIMBING_SUB_ACTIVITY.CLIMBING_GARDEN) {
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
        name: agentOutput.name,
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
      routeName: agentOutput.routeName,
      routeNames: agentOutput.routeNames,
      summit: agentOutput.summit,
    },
  });
}

function extractHikrWaypointNames(input: HikrOrgPostBaseLayerInput): string[] {
  const waypointNames = [...input.reportWaypoints]
    .sort((left, right) => left.position - right.position)
    .map(({ waypoint }) => {
      const name = normalizeDescription(waypoint.name);
      return name && waypoint.heightMeters ? `${name} (${waypoint.heightMeters}m)` : name;
    })
    .filter(Boolean);

  return [...new Set(waypointNames)];
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
    skipReason: buildSkipReason(base, reasons),
  };
}

function buildSkipReason(
  base: ReportBasePreprocessorOutput,
  reasons: ClimbingPreprocessorReason[],
): string | null {
  if (base.status !== PREPROCESSOR_STATUS.SKIPPED) {
    return null;
  }

  if (reasons.includes('unsupported_activity_scales')) {
    return 'Report uses unsupported activity difficulty scales.';
  }

  if (reasons.includes('unsupported_activity_combination')) {
    return 'Report difficulty scales do not map to a supported activity.';
  }

  if (reasons.includes('non_climbing_activity')) {
    return base.activity
      ? `Report activity is ${base.activity}, not ${ACTIVITY.CLIMBING}.`
      : `Report activity is not ${ACTIVITY.CLIMBING}.`;
  }

  if (reasons.includes('missing_climbing_preprocessor_agent')) {
    return 'Climbing preprocessor agent is not configured.';
  }

  if (reasons.includes('no_climbing_preprocessor_agent_match')) {
    return 'Climbing preprocessor agent did not identify a Klettertour or Klettergarten.';
  }

  return 'Report was skipped by the climbing preprocessor.';
}
