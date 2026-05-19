import { PrismaClient } from '@hikr/db';
import { HIKR_ORG_POST_BASE_LAYER_SELECT } from '@hikr/shared';
import type {
  ClimbingDataPipelineDatabase,
  ClimbingGardenBasePreprocessorOutput,
  ClimbingTourBasePreprocessorOutput,
  HikrOrgPostBaseLayerInput,
  ReportBaseSchemaWriteInput,
} from '@hikr/shared';

export function createPostgresDatabase(prisma: PrismaClient): ClimbingDataPipelineDatabase {
  return {
    async findHikrOrgPostsForPreprocessing(): Promise<HikrOrgPostBaseLayerInput[]> {
      return prisma.hikrOrgPostSchema.findMany({
        select: HIKR_ORG_POST_BASE_LAYER_SELECT,
        orderBy: { id: 'asc' },
      });
    },

    async upsertReportBase(input: ReportBaseSchemaWriteInput): Promise<void> {
      await prisma.reportBaseSchema.upsert({
        where: { reportId: input.reportId },
        create: {
          reportId: input.reportId,
          status: input.status,
          activity: input.activity,
          subActivity: input.subActivity,
          canton: input.canton,
          tourDate: input.tourDate,
          region: input.region,
        },
        update: {
          status: input.status,
          activity: input.activity,
          subActivity: input.subActivity,
          canton: input.canton,
          tourDate: input.tourDate,
          region: input.region,
        },
      });
    },

    async findRouteSummitNames({ activity, subActivity, canton }): Promise<string[]> {
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
    },

    async findRouteNames({ activity, subActivity, canton, summitName }): Promise<string[]> {
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
    },

    async findRouteCragNames({ activity, subActivity, canton }): Promise<string[]> {
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
    },

    async upsertClimbingTourBase(input: ClimbingTourBasePreprocessorOutput): Promise<void> {
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
    },

    async upsertClimbingGardenBase(input: ClimbingGardenBasePreprocessorOutput): Promise<void> {
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
    },
  };
}
