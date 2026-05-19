import type { PrismaClient } from '../../../generated/client';
import type { RouteCragNamesLookupInput } from '../types';

export async function findRouteCragNames(
  prisma: PrismaClient,
  { activity, subActivity, canton }: RouteCragNamesLookupInput,
): Promise<string[]> {
  const routes = await prisma.routeSchema.findMany({
    where: {
      activity,
      subActivity,
      canton,
      cragName: { not: null },
    },
    distinct: ['cragName'],
    select: { cragName: true },
    orderBy: { cragName: 'asc' },
  });

  return routes.flatMap((route) => (route.cragName ? [route.cragName] : []));
}
