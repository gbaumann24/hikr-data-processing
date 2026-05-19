import type { PrismaClient } from '../../../generated/client';
import {
  HIKR_ORG_POST_BASE_LAYER_SELECT,
  type HikrOrgPostBaseLayerInput,
} from '../../hikr-org-post';

export async function findHikrOrgPostsForPreprocessing(
  prisma: PrismaClient,
): Promise<HikrOrgPostBaseLayerInput[]> {
  return prisma.hikrOrgPostSchema.findMany({
    select: HIKR_ORG_POST_BASE_LAYER_SELECT,
    orderBy: { id: 'asc' },
  });
}
