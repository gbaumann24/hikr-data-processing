import { PrismaClient } from '@hikr/db';
import type { ClimbingDataPipelineDatabase } from 'agent/mastra';
import type {
  HikrOrgPostBaseLayerInput,
  ReportBaseSchemaWriteInput,
} from 'agent/mastra';
import type {
  ClimbingTourBasePreprocessorOutput,
  ClimbingGardenBasePreprocessorOutput,
} from 'agent/mastra';

export function createPostgresDatabase(prisma: PrismaClient): ClimbingDataPipelineDatabase {
  return {
    async findHikrOrgPostsForClimbingPreprocessing(): Promise<HikrOrgPostBaseLayerInput[]> {
      const rows = await prisma.hikrOrgPostSchema.findMany({
        select: {
          id: true,
          title: true,
          regionPathCsv: true,
          tourDate: true,
          hikingDifficulty: true,
          alpineTourDifficulty: true,
          climbingDifficulty: true,
          snowshoeTourDifficulty: true,
          viaFerrataDifficulty: true,
          skiDifficulty: true,
          iceClimbingDifficulty: true,
          mountainBikeDifficulty: true,
          description: true,
        },
        orderBy: { id: 'asc' },
      });

      return rows.map((row) => ({
        id: row.id,
        title: row.title,
        regionPathCsv: row.regionPathCsv,
        description: row.description,
        tourDate: row.tourDate,
        hikingDifficulty: row.hikingDifficulty,
        alpineTourDifficulty: row.alpineTourDifficulty,
        climbingDifficulty: row.climbingDifficulty,
        snowshoeTourDifficulty: row.snowshoeTourDifficulty,
        viaFerrataDifficulty: row.viaFerrataDifficulty,
        skiDifficulty: row.skiDifficulty,
        iceClimbingDifficulty: row.iceClimbingDifficulty,
        mountainBikeDifficulty: row.mountainBikeDifficulty,
      }));
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
