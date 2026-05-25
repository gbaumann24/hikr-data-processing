import type { ReportBaseSchema } from '@hikr/db';

export { HIKR_ORG_POST_BASE_LAYER_SELECT } from '@hikr/db';
export type { HikrOrgPostBaseLayerInput } from '@hikr/db';

export type ReportBaseSchemaWriteInput = Pick<
  ReportBaseSchema,
  'reportId' | 'status' | 'activity' | 'subActivity' | 'canton' | 'tourDate' | 'region' | 'reasons'
>;
