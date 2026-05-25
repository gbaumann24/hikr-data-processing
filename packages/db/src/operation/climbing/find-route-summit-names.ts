import type { PrismaClient } from '../../../generated/client';
import type { RouteSummitNamesLookupInput } from '../types';

export async function findRouteSummitNames(
  prisma: PrismaClient,
  { activity, subActivity, canton }: RouteSummitNamesLookupInput,
): Promise<string[]> {
  const summits = await prisma.summitSchema.findMany({
    where: {
      canton,
      routes: {
        some: {
          activity,
          subActivity,
          canton,
        },
      },
    },
    select: { summitName: true },
    orderBy: { summitName: 'asc' },
  });

  return summits.map((summit) => summit.summitName);
}
