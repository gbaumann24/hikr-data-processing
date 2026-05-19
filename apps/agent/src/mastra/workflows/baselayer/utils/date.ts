import type { ReportBasePreprocessorOutput } from '../types';

export function normalizeDateOnly(value: ReportBasePreprocessorOutput['tourDate']): Date | null {
  if (value === null) {
    return null;
  }

  if (Number.isNaN(value.getTime())) {
    throw new Error('Tour date must be a valid Date');
  }

  return value;
}
