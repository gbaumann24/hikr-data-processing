import { describe, expect, test } from 'bun:test';
import type { PrismaClient } from '@hikr/db';
import {
  ACTIVITY,
  CLIMBING_PREPROCESSOR_SCHEMA_VERSION,
  CLIMBING_SUB_ACTIVITY,
  PREPROCESSOR_STATUS,
} from '@hikr/shared';
import { createPostgresDatabase } from '../src/database/postgres';

describe('postgres database adapter', () => {
  test('wires climbing persistence through operation modules', async () => {
    const calls: string[] = [];
    const reportBase = {
      activity: ACTIVITY.CLIMBING,
      subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR,
      canton: 'Obwalden',
    };

    const tx = {
      reportBaseSchema: {
        findUnique: async () => reportBase,
      },
      routeSchema: {
        upsert: async () => {
          calls.push('tx.routeSchema.upsert');
          return { id: 7n };
        },
      },
      climbingTourBaseSchema: {
        upsert: async () => {
          calls.push('tx.climbingTourBaseSchema.upsert');
        },
      },
      climbingGardenBaseSchema: {
        upsert: async () => {
          calls.push('tx.climbingGardenBaseSchema.upsert');
        },
      },
    };

    const prisma = {
      reportBaseSchema: {
        upsert: async () => {
          calls.push('reportBaseSchema.upsert');
        },
      },
      routeSchema: {
        findMany: async ({ distinct }: { distinct: string[] }) => {
          calls.push(`routeSchema.findMany.${distinct[0]}`);
          return distinct[0] === 'routeName'
            ? [{ routeName: 'Südgrat' }]
            : distinct[0] === 'cragName'
              ? [{ cragName: 'Melchtal' }]
              : [{ summitName: 'Gross Turm' }];
        },
      },
      $transaction: async (callback: (transaction: typeof tx) => Promise<void>) => {
        calls.push('$transaction');
        await callback(tx);
      },
    } as unknown as PrismaClient;

    const database = createPostgresDatabase(prisma);

    await database.upsertReportBase({
      reportId: 42n,
      status: PREPROCESSOR_STATUS.READY,
      activity: ACTIVITY.CLIMBING,
      subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR,
      canton: 'Obwalden',
      tourDate: null,
      region: null,
    });
    await expect(
      database.findRouteSummitNames({
        activity: ACTIVITY.CLIMBING,
        subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR,
        canton: 'Obwalden',
      }),
    ).resolves.toEqual(['Gross Turm']);
    await expect(
      database.findRouteNames({
        activity: ACTIVITY.CLIMBING,
        subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR,
        canton: 'Obwalden',
        summitName: 'Gross Turm',
      }),
    ).resolves.toEqual(['Südgrat']);
    await expect(
      database.findRouteCragNames({
        activity: ACTIVITY.CLIMBING,
        subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_GARDEN,
        canton: 'Obwalden',
      }),
    ).resolves.toEqual(['Melchtal']);
    await database.upsertClimbingTourBase({
      reportId: 42n,
      schemaVersion: CLIMBING_PREPROCESSOR_SCHEMA_VERSION,
      routeName: 'Südgrat',
      summit: 'Gross Turm',
    });
    await database.upsertClimbingGardenBase({
      reportId: 43n,
      name: 'Melchtal',
    });

    expect(calls).toEqual([
      'reportBaseSchema.upsert',
      'routeSchema.findMany.summitName',
      'routeSchema.findMany.routeName',
      'routeSchema.findMany.cragName',
      '$transaction',
      'tx.routeSchema.upsert',
      'tx.climbingTourBaseSchema.upsert',
      '$transaction',
      'tx.routeSchema.upsert',
      'tx.climbingGardenBaseSchema.upsert',
    ]);
  });
});
