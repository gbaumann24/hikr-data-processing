import type { PrismaClient } from '../../../generated/client';
import type { RouteNamesLookupInput, RouteNamesLookupOutput } from '../types';

export async function findRouteNames(
  prisma: PrismaClient,
  { activity, subActivity, canton, summitName }: RouteNamesLookupInput,
): Promise<RouteNamesLookupOutput[]> {
  const routes = await prisma.routeSchema.findMany({
    where: {
      activity,
      subActivity,
      canton,
      summitName,
      routeName: { not: null },
    },
    select: { routeName: true, routeNames: true },
    orderBy: { routeName: 'asc' },
  });

  const routeNamesByCanonicalName = new Map<string, string[]>();

  for (const route of routes) {
    const routeName = normalizeName(route.routeName);

    if (!routeName) {
      continue;
    }

    routeNamesByCanonicalName.set(
      routeName,
      normalizeRouteNames(routeName, [
        ...(routeNamesByCanonicalName.get(routeName) ?? []),
        ...route.routeNames,
      ]),
    );
  }

  return [...routeNamesByCanonicalName.entries()].map(([routeName, routeNames]) => ({
    routeName,
    routeNames,
  }));
}

function normalizeRouteNames(routeName: string, names: string[]): string[] {
  return [
    routeName,
    ...new Set(
      names.map((name) => normalizeName(name)).filter((name) => name !== '' && name !== routeName),
    ),
  ];
}

function normalizeName(name: string | null): string {
  return name?.replace(/\s+/g, ' ').trim() ?? '';
}
