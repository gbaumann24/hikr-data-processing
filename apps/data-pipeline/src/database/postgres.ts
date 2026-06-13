import {
  PrismaClient,
  findHikrOrgPostsForPreprocessing,
  findRouteCragNames,
  findRouteNames,
  findRouteSummitNames,
  updateSummitHeightIfMissing,
  upsertClimbingGardenBase,
  upsertClimbingTourBase,
  upsertClimbingTourDetails,
  upsertReportBase,
} from '@hikr/db';
import type { ClimbingDataPipelineDatabase } from '@hikr/shared';

export function createPostgresDatabase(prisma: PrismaClient): ClimbingDataPipelineDatabase {
  return {
    findHikrOrgPostsForPreprocessing: () => findHikrOrgPostsForPreprocessing(prisma),
    upsertReportBase: (input) => upsertReportBase(prisma, input),
    findRouteSummitNames: (input) => findRouteSummitNames(prisma, input),
    findRouteNames: (input) => findRouteNames(prisma, input),
    findRouteCragNames: (input) => findRouteCragNames(prisma, input),
    upsertClimbingTourBase: (input) => upsertClimbingTourBase(prisma, input),
    upsertClimbingGardenBase: (input) => upsertClimbingGardenBase(prisma, input),
    upsertClimbingTourDetails: (input) => upsertClimbingTourDetails(prisma, input),
    updateSummitHeightIfMissing: (input) => updateSummitHeightIfMissing(prisma, input),
  };
}
