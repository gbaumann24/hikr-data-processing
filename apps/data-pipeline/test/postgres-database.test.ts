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
  test('reads source posts in deterministic report order', async () => {
    const calls: unknown[] = [];
    const prisma = {
      hikrOrgPostSchema: {
        findMany: async (options: unknown) => {
          calls.push(options);
          return [];
        },
      },
    } as unknown as PrismaClient;

    const database = createPostgresDatabase(prisma);

    await database.findHikrOrgPostsForPreprocessing();

    expect(calls).toMatchObject([
      {
        orderBy: [{ id: 'asc' }, { hikrPostId: 'asc' }],
      },
    ]);
  });

  test('wires climbing persistence through operation modules', async () => {
    const calls: string[] = [];
    const routeUpdates: unknown[] = [];
    const reportBase = {
      activity: ACTIVITY.CLIMBING,
      subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR,
      canton: 'Obwalden',
    };

    const tx = {
      reportBaseSchema: {
        findUnique: async () => reportBase,
      },
      summitSchema: {
        upsert: async () => {
          calls.push('tx.summitSchema.upsert');
          return { id: 5n };
        },
      },
      routeSchema: {
        upsert: async () => {
          calls.push('tx.routeSchema.upsert');
          return { id: 7n, routeNames: ['Südgrat'] };
        },
        update: async (input: unknown) => {
          calls.push('tx.routeSchema.update');
          routeUpdates.push(input);
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
        findMany: async ({
          distinct,
          select,
        }: {
          distinct?: string[];
          select: Record<string, true>;
        }) => {
          const lookupKey = distinct?.[0] ?? Object.keys(select).join('+');
          calls.push(`routeSchema.findMany.${lookupKey}`);
          return lookupKey === 'routeName+routeNames'
            ? [{ routeName: 'Südgrat', routeNames: ['Südgrat', 'S-Grat'] }]
            : [{ cragName: 'Melchtal' }];
        },
      },
      summitSchema: {
        findMany: async ({ select }: { select: Record<string, true> }) => {
          const lookupKey = Object.keys(select).join('+');
          calls.push(`summitSchema.findMany.${lookupKey}`);
          return [{ summitName: 'Gross Turm' }];
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
      reasons: ['ready'],
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
    ).resolves.toEqual([{ routeName: 'Südgrat', routeNames: ['Südgrat', 'S-Grat'] }]);
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
      routeNames: ['Südgrat', 'S-Grat'],
      summit: 'Gross Turm',
    });
    await database.upsertClimbingGardenBase({
      reportId: 43n,
      name: 'Melchtal',
    });

    expect(calls).toEqual([
      'reportBaseSchema.upsert',
      'summitSchema.findMany.summitName',
      'routeSchema.findMany.routeName+routeNames',
      'routeSchema.findMany.cragName',
      '$transaction',
      'tx.summitSchema.upsert',
      'tx.routeSchema.upsert',
      'tx.routeSchema.update',
      'tx.climbingTourBaseSchema.upsert',
      '$transaction',
      'tx.routeSchema.upsert',
      'tx.climbingGardenBaseSchema.upsert',
    ]);
    expect(routeUpdates).toEqual([
      {
        where: { id: 7n },
        data: { routeNames: ['Südgrat', 'S-Grat'] },
      },
    ]);
  });
});
