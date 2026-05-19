import type { PrismaClient } from '../../../generated/client';
import type { ClimbingGardenBasePreprocessorOutput } from '../types';

export async function upsertClimbingGardenBase(
  prisma: PrismaClient,
  input: ClimbingGardenBasePreprocessorOutput,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const reportBase = await tx.reportBaseSchema.findUnique({
      where: { reportId: input.reportId },
      select: { activity: true, subActivity: true, canton: true },
    });

    if (!reportBase?.activity || !reportBase.subActivity || !reportBase.canton) {
      throw new Error(
        `Cannot persist climbing garden route for report ${input.reportId.toString()} without activity, subActivity, and canton`,
      );
    }

    await tx.routeSchema.upsert({
      where: {
        activitySubActivityCragNameCanton: {
          activity: reportBase.activity,
          subActivity: reportBase.subActivity,
          cragName: input.name,
          canton: reportBase.canton,
        },
      },
      create: {
        activity: reportBase.activity,
        subActivity: reportBase.subActivity,
        cragName: input.name,
        canton: reportBase.canton,
      },
      update: {},
    });

    await tx.climbingGardenBaseSchema.upsert({
      where: { reportId: input.reportId },
      create: {
        reportId: input.reportId,
        name: input.name,
      },
      update: {
        name: input.name,
      },
    });
  });
}
