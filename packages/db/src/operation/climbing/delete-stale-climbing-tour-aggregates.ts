import type { PrismaClient } from '../../../generated/client';

export async function deleteStaleClimbingTourAggregates(
  prisma: PrismaClient,
  qualifyingRouteIds: bigint[],
): Promise<number> {
  const result =
    qualifyingRouteIds.length === 0
      ? await prisma.climbingTourAggregateSchema.deleteMany()
      : await prisma.climbingTourAggregateSchema.deleteMany({
          where: {
            routeId: { notIn: qualifyingRouteIds },
          },
        });

  return result.count;
}
