import type { PrismaClient } from '../../../generated/client';

export type PipelineOutputPurgeResult = {
  reportBaseRows: number;
  routeRows: number;
  summitRows: number;
};

export async function purgePipelineOutput(
  prisma: PrismaClient,
): Promise<PipelineOutputPurgeResult> {
  return prisma.$transaction(async (tx) => {
    const reportBase = await tx.reportBaseSchema.deleteMany();
    const routes = await tx.routeSchema.deleteMany();
    const summits = await tx.summitSchema.deleteMany();

    return {
      reportBaseRows: reportBase.count,
      routeRows: routes.count,
      summitRows: summits.count,
    };
  });
}
