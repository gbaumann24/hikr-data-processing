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
    distinct: ['routeName'],
    select: { routeName: true },
    orderBy: { routeName: 'asc' },
  });

  return routes.flatMap((route) => (route.routeName ? [route.routeName] : []));
}
