import type { ReportBasePreprocessorOutput } from '../types';

export function normalizeDateOnly(value: ReportBasePreprocessorOutput['tourDate']): Date | null {
  if (value === null) {
    return null;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error('Tour date must be a valid Date');
    }

    return value;
  }

  const normalized = value.trim();

  if (normalized === '') {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return new Date(`${normalized}T00:00:00.000Z`);
  }

  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Tour date must be a valid date string, got ${value}`);
  }

  return parsed;
}
