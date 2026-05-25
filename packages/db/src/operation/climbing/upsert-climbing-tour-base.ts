import type { PrismaClient } from '../../../generated/client';
import type { ClimbingTourBasePreprocessorOutput } from '../types';

export async function upsertClimbingTourBase(
  prisma: PrismaClient,
  input: ClimbingTourBasePreprocessorOutput,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const reportBase = await tx.reportBaseSchema.findUnique({
      where: { reportId: input.reportId },
      select: { activity: true, subActivity: true, canton: true },
    });

    if (!reportBase?.activity || !reportBase.subActivity || !reportBase.canton) {
      throw new Error(
        `Cannot persist climbing tour route for report ${input.reportId.toString()} without activity, subActivity, and canton`,
      );
    }

    const inputRouteNames = normalizeRouteNames(input.routeNames, input.routeName);
    const route = await tx.routeSchema.upsert({
      where: {
        activityRouteNameSummitCanton: {
          activity: reportBase.activity,
          routeName: input.routeName,
          summitName: input.summit,
          canton: reportBase.canton,
        },
      },
      create: {
        activity: reportBase.activity,
        subActivity: reportBase.subActivity,
        routeName: input.routeName,
        routeNames: inputRouteNames,
        summitName: input.summit,
        canton: reportBase.canton,
      },
      update: {
        subActivity: reportBase.subActivity,
      },
    });

    const routeNames = normalizeRouteNames(
      [...route.routeNames, ...inputRouteNames],
      input.routeName,
    );

    if (!areEqualStringArrays(route.routeNames, routeNames)) {
      await tx.routeSchema.update({
        where: { id: route.id },
        data: { routeNames },
      });
    }

    await tx.climbingTourBaseSchema.upsert({
      where: { reportId: input.reportId },
      create: {
        reportId: input.reportId,
        schemaVersion: input.schemaVersion,
        routeId: route.id,
      },
      update: {
        schemaVersion: input.schemaVersion,
        routeId: route.id,
      },
    });
  });
}

function normalizeRouteNames(routeNames: string[], routeName: string): string[] {
  return [
    ...new Set(
      [routeName, ...routeNames]
        .map((name) => name.replace(/\s+/g, ' ').trim())
        .filter((name) => name !== ''),
    ),
  ];
}

function areEqualStringArrays(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
