import type { PrismaClient } from '../../../generated/client';

export async function updateSummitHeightIfMissing(
  prisma: PrismaClient,
  input: { canton: string; summitName: string; heightMeters: number },
): Promise<void> {
  await prisma.summitSchema.updateMany({
    where: {
      summitName: input.summitName,
      canton: input.canton,
      heightMeters: null,
    },
    data: {
      heightMeters: input.heightMeters,
    },
  });
}
