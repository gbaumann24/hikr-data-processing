import type { ReportBasePreprocessorOutput, ReportBaseSchemaWriteInput } from '../types';
import { normalizeDateOnly } from './date';

export function mapReportBaseToSchemaWrite(
  base: ReportBasePreprocessorOutput,
  reasons: string[] = [],
): ReportBaseSchemaWriteInput {
  return {
    reportId: base.reportId,
    status: base.status,
    activity: base.activity,
    subActivity: base.subActivity,
    canton: base.canton,
    tourDate: normalizeDateOnly(base.tourDate),
    region: base.region,
    reasons,
  };
}
