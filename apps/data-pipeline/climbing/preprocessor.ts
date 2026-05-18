import {
  ACTIVITY,
  PREPROCESSOR_STATUS,
  normalizeDescription,
  prepareBaseLayer,
  type HikrPreprocessorInput,
  type ReportBasePreprocessorOutput,
} from '../baselayer';
import { classifyActivity } from './activity';
import {
  CLIMBING_PREPROCESSOR_SCHEMA_VERSION,
  CLIMBING_SUB_ACTIVITY,
  type ClimbingPreprocessorOutput,
  type ClimbingPreprocessorReason,
  type ClimbingSubActivityClassification,
  type ClimbingSubActivityClassifier,
  type ClimbingSubActivityClassifierInput,
} from './types';

export async function preprocessHikrReportForClimbing(
  input: HikrPreprocessorInput,
  options: { classifySubActivity?: ClimbingSubActivityClassifier } = {},
): Promise<ClimbingPreprocessorOutput> {
  const baseLayer = prepareBaseLayer(input);
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

  if (!options.classifySubActivity) {
    return buildOutput({
      base,
      normalizedDescription: baseLayer.normalizedDescription,
      reasons: ['missing_sub_activity_classifier'],
    });
  }

  const classificationInput: ClimbingSubActivityClassifierInput = {
    title: normalizeDescription(input.title),
    description: baseLayer.normalizedDescription,
  };
  const classification = await options.classifySubActivity(classificationInput);
  const parsedClassification = parseSubActivityClassification(classification);

  if (!parsedClassification) {
    return buildOutput({
      base,
      normalizedDescription: baseLayer.normalizedDescription,
      reasons: ['invalid_sub_activity_classification'],
    });
  }

  if (parsedClassification.subActivity === null) {
    return buildOutput({
      base,
      normalizedDescription: baseLayer.normalizedDescription,
      reasons: ['no_climbing_sub_activity'],
    });
  }

  if (parsedClassification.subActivity === CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR) {
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
        routeName: parsedClassification.routeName,
        summit: parsedClassification.summit,
      },
    });
  }

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
      name: parsedClassification.name,
    },
  });
}

export function parseSubActivityClassification(
  classification: unknown,
): ClimbingSubActivityClassification | null {
  if (!classification || typeof classification !== 'object') {
    return null;
  }

  const record = classification as Record<string, unknown>;

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
    const reason = typeof record.reason === 'string' ? record.reason.trim() : undefined;
    return reason ? { subActivity: null, reason } : { subActivity: null };
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
