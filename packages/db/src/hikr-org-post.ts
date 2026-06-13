import type { Prisma } from '../generated/client';

export const HIKR_ORG_POST_BASE_LAYER_SELECT = {
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
  reportWaypoints: {
    orderBy: { position: 'asc' },
    select: {
      position: true,
      waypoint: {
        select: {
          name: true,
          heightMeters: true,
        },
      },
    },
  },
} satisfies Prisma.HikrOrgPostSchemaSelect;

export type HikrOrgPostBaseLayerInput = Prisma.HikrOrgPostSchemaGetPayload<{
  select: typeof HIKR_ORG_POST_BASE_LAYER_SELECT;
}>;
