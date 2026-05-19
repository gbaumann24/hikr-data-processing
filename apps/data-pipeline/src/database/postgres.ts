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
    async findHikrOrgPostsForClimbingPreprocessing(): Promise<HikrOrgPostBaseLayerInput[]> {
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

    async upsertClimbingTourBase(input: ClimbingTourBasePreprocessorOutput): Promise<void> {
      await prisma.climbingTourBaseSchema.upsert({
        where: { reportId: input.reportId },
        create: {
          reportId: input.reportId,
          schemaVersion: input.schemaVersion,
          routeName: input.routeName,
          summit: input.summit,
        },
        update: {
          schemaVersion: input.schemaVersion,
          routeName: input.routeName,
          summit: input.summit,
        },
      });
    },

    async upsertClimbingGardenBase(input: ClimbingGardenBasePreprocessorOutput): Promise<void> {
      await prisma.climbingGardenBaseSchema.upsert({
        where: { reportId: input.reportId },
        create: {
          reportId: input.reportId,
          name: input.name,
        },
        update: {
          name: input.name,
        },
      });
    },
  };
}
