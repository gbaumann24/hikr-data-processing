import { PREPROCESSOR_STATUS } from '../../baselayer';
import type { ClimbingPreprocessorOutput } from '../preprocessor';
import type { ClimbingExtractor } from './types';

export async function extractPreparedClimbingReport(
  input: ClimbingPreprocessorOutput,
  options: { title?: string | null; extractClimbing?: ClimbingExtractor } = {},
): Promise<ClimbingPreprocessorOutput> {
  if (input.base.status !== PREPROCESSOR_STATUS.READY || !options.extractClimbing) {
    return input;
  }

  await options.extractClimbing({
    title: options.title ?? null,
    preprocessed: input,
  });

  return input;
}
