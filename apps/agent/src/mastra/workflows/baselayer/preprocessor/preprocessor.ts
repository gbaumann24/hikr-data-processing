import { extractDifficultyScales, normalizeDescription, parseRegionPath } from '../utils';
import {
  MIN_DESCRIPTION_LENGTH,
  PREPROCESSOR_STATUS,
  type BaseLayerPreprocessorOutput,
  type BaseLayerPreprocessorReason,
  type HikrPreprocessorInput,
  type ReportBasePreprocessorOutput,
} from '../types';

export function prepareBaseLayer(input: HikrPreprocessorInput): BaseLayerPreprocessorOutput {
  const reportId = normalizeReportId(input.reportId);
  const normalizedDescription = normalizeDescription(input.description);
  const regionPath = parseRegionPath(input.regionPathCsv);
  const reasons: BaseLayerPreprocessorReason[] = [];

  if (normalizedDescription.length < MIN_DESCRIPTION_LENGTH) {
    reasons.push('description_too_short');
  }

  if (!regionPath.canton) {
    reasons.push('missing_canton');
  }

  const isInsufficient = reasons.length > 0;
  const base: ReportBasePreprocessorOutput = {
    reportId,
    status: isInsufficient ? PREPROCESSOR_STATUS.INSUFFICIENT : PREPROCESSOR_STATUS.SKIPPED,
    activity: null,
    subActivity: null,
    canton: regionPath.canton,
    tourDate: input.tourDate ?? null,
    region: regionPath.region,
  };

  return {
    base,
    difficultyScales: extractDifficultyScales(input),
    normalizedDescription,
    normalizedDescriptionLength: normalizedDescription.length,
    reasons,
    isInsufficient,
  };
}

export function normalizeReportId(reportId: HikrPreprocessorInput['reportId']): bigint {
  if (typeof reportId === 'bigint') {
    return reportId;
  }

  if (typeof reportId === 'number') {
    if (!Number.isInteger(reportId)) {
      throw new Error(`Report id must be an integer, got ${reportId}`);
    }
    return BigInt(reportId);
  }

  if (/^-?\d+$/.test(reportId)) {
    return BigInt(reportId);
  }

  throw new Error(`Report id must be an integer string, got ${reportId}`);
}
