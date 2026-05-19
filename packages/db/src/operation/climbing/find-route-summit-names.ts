import type { PrismaClient } from '../../../generated/client';
import type { RouteSummitNamesLookupInput } from '../types';

export async function findRouteSummitNames(
  prisma: PrismaClient,
  { activity, subActivity, canton }: RouteSummitNamesLookupInput,
): Promise<string[]> {
  const routes = await prisma.routeSchema.findMany({
    where: {
      activity,
      subActivity,
      canton,
      summitName: { not: null },
    },
    distinct: ['summitName'],
    select: { summitName: true },
    orderBy: { summitName: 'asc' },
  });

  return routes.flatMap((route) => (route.summitName ? [route.summitName] : []));
}
