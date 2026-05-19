import type { PreprocessorStatus } from '../../../baselayer';

export function createStatusCounts(): Record<PreprocessorStatus, number> {
  return {
    ready: 0,
    skipped: 0,
    insufficient: 0,
  };
}
