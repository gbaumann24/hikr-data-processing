import { extractDifficultyScales, normalizeDescription, parseRegionPath } from '../utils';
import {
  MIN_DESCRIPTION_LENGTH,
  PREPROCESSOR_STATUS,
  type BaseLayerPreprocessorOutput,
  type BaseLayerPreprocessorReason,
  type HikrOrgPostBaseLayerInput,
  type ReportBasePreprocessorOutput,
} from '../types';

export function prepareBaseLayer(input: HikrOrgPostBaseLayerInput): BaseLayerPreprocessorOutput {
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
    reportId: input.id,
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
