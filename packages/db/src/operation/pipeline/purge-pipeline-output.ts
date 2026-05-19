import type { PrismaClient } from '../../../generated/client';

export type PipelineOutputPurgeResult = {
  reportBaseRows: number;
  routeRows: number;
};

export async function purgePipelineOutput(
  prisma: PrismaClient,
): Promise<PipelineOutputPurgeResult> {
  return prisma.$transaction(async (tx) => {
    const reportBase = await tx.reportBaseSchema.deleteMany();
    const routes = await tx.routeSchema.deleteMany();

    return {
      reportBaseRows: reportBase.count,
      routeRows: routes.count,
    };
  });
}
