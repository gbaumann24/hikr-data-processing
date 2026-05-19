import type { PrismaClient } from '../../../generated/client';
import type { ReportBaseSchemaWriteInput } from '../types';

export async function upsertReportBase(
  prisma: PrismaClient,
  input: ReportBaseSchemaWriteInput,
): Promise<void> {
  await prisma.reportBaseSchema.upsert({
    where: { reportId: input.reportId },
    create: {
      reportId: input.reportId,
      status: input.status,
      activity: input.activity,
      subActivity: input.subActivity,
      canton: input.canton,
      tourDate: input.tourDate,
      region: input.region,
    },
    update: {
      status: input.status,
      activity: input.activity,
      subActivity: input.subActivity,
      canton: input.canton,
      tourDate: input.tourDate,
      region: input.region,
    },
  });
}
