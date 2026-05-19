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
        summitName: input.summit,
        canton: reportBase.canton,
      },
      update: {
        subActivity: reportBase.subActivity,
      },
    });

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
