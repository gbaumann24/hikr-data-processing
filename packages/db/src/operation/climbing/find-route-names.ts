import type { PrismaClient } from '../../../generated/client';
import type { RouteNamesLookupInput } from '../types';

export async function findRouteNames(
  prisma: PrismaClient,
  { activity, subActivity, canton, summitName }: RouteNamesLookupInput,
): Promise<string[]> {
  const routes = await prisma.routeSchema.findMany({
    where: {
      activity,
      subActivity,
      canton,
      summitName,
      routeName: { not: null },
    },
    select: { routeName: true },
    distinct: ['routeName'],
    orderBy: { routeName: 'asc' },
  });

  return routes
    .map((route) => route.routeName)
    .filter((name): name is string => typeof name === 'string' && name.trim() !== '');
}
