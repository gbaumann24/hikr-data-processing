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

  test('wires extraction job tracking through operation modules', async () => {
    const calls: string[] = [];
    const jobUpdates: unknown[] = [];
    const reportUpserts: unknown[] = [];
    const now = new Date('2026-01-01T00:00:00.000Z');
    const jobRow = {
      id: 100n,
      workflow: 'climbing-pipeline',
      status: 'running',
      schemaVersion: 'climbing-extraction-v1',
      limit: 5,
      totalReports: null,
      processedReports: 0,
      succeededReports: 0,
      failedReports: 0,
      statusCounts: {},
      lastReportId: null,
      errorMessage: null,
      errorDetails: null,
      startedAt: now,
      finishedAt: null,
      lastHeartbeatAt: now,
      createdAt: now,
      updatedAt: now,
    };
    const tx = {
      extractionJobReportSchema: {
        findUnique: async () => {
          calls.push('tx.extractionJobReportSchema.findUnique');
          return { status: 'running' };
        },
        upsert: async (input: unknown) => {
          calls.push('tx.extractionJobReportSchema.upsert');
          reportUpserts.push(input);
        },
      },
      extractionJobSchema: {
        update: async (input: unknown) => {
          calls.push('tx.extractionJobSchema.update');
          jobUpdates.push(input);
        },
      },
    };
    const prisma = {
      extractionJobSchema: {
        create: async () => {
          calls.push('extractionJobSchema.create');
          return jobRow;
        },
        findUnique: async () => {
          calls.push('extractionJobSchema.findUnique');
          return jobRow;
        },
        update: async (input: unknown) => {
          calls.push('extractionJobSchema.update');
          jobUpdates.push(input);
        },
      },
      extractionJobReportSchema: {
        findMany: async () => {
          calls.push('extractionJobReportSchema.findMany');
          return [{ reportId: 42n }];
        },
      },
      $transaction: async (callback: (transaction: typeof tx) => Promise<void>) => {
        calls.push('$transaction');
        await callback(tx);
      },
    } as unknown as PrismaClient;

    const database = createPostgresDatabase(prisma);

    await expect(
      database.createExtractionJob({
        workflow: 'climbing-pipeline',
        schemaVersion: 'climbing-extraction-v1',
        limit: 5,
      }),
    ).resolves.toMatchObject({
      id: 100n,
      workflow: 'climbing-pipeline',
      statusCounts: {},
    });
    await expect(database.findExtractionJob(100n)).resolves.toMatchObject({ id: 100n });
    await database.updateExtractionJobTotals({ jobId: 100n, totalReports: 5, limit: 5 });
    await expect(database.findTerminalExtractionJobReportIds(100n)).resolves.toEqual(
      new Set([42n]),
    );
    await database.startExtractionJobReport({
      jobId: 100n,
      reportId: 42n,
      mastraRunId: 'run-1',
    });
    await database.finishExtractionJobReport({
      jobId: 100n,
      reportId: 42n,
      status: 'success',
      workflowStatus: 'success',
      preprocessorStatus: PREPROCESSOR_STATUS.READY,
      elapsedMs: 25,
    });
    await database.finishExtractionJob({
      jobId: 100n,
      status: 'completed',
      statusCounts: { ready: 1 },
      processedReports: 1,
      succeededReports: 1,
      failedReports: 0,
      lastReportId: 42n,
    });

    expect(calls).toEqual([
      'extractionJobSchema.create',
      'extractionJobSchema.findUnique',
      'extractionJobSchema.update',
      'extractionJobReportSchema.findMany',
      '$transaction',
      'tx.extractionJobReportSchema.upsert',
      'tx.extractionJobSchema.update',
      '$transaction',
      'tx.extractionJobReportSchema.findUnique',
      'tx.extractionJobReportSchema.upsert',
      'tx.extractionJobSchema.update',
      'extractionJobSchema.update',
    ]);
    expect(reportUpserts).toHaveLength(2);
    expect(jobUpdates.at(-1)).toMatchObject({
      where: { id: 100n },
      data: {
        status: 'completed',
        processedReports: 1,
        succeededReports: 1,
        failedReports: 0,
        lastReportId: 42n,
      },
    });
  });

  test('wires climbing persistence through operation modules', async () => {
    const calls: string[] = [];
    const climbingTourBaseUpdates: unknown[] = [];
    const detailUpserts: unknown[] = [];
    const routeUpdates: unknown[] = [];
    const summitUpserts: unknown[] = [];
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
        findFirst: async () => {
          calls.push('tx.summitSchema.findFirst');
          return null;
        },
        upsert: async (input: unknown) => {
          calls.push('tx.summitSchema.upsert');
          summitUpserts.push(input);
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
        findUnique: async () => {
          calls.push('tx.climbingTourBaseSchema.findUnique');
          return { reportId: 42n };
        },
        upsert: async () => {
          calls.push('tx.climbingTourBaseSchema.upsert');
        },
        update: async (input: unknown) => {
          calls.push('tx.climbingTourBaseSchema.update');
          climbingTourBaseUpdates.push(input);
        },
      },
      climbingGardenBaseSchema: {
        upsert: async () => {
          calls.push('tx.climbingGardenBaseSchema.upsert');
        },
      },
      climbingTourAusruestungSchema: {
        upsert: async (input: unknown) => {
          calls.push('tx.climbingTourAusruestungSchema.upsert');
          detailUpserts.push(input);
        },
        deleteMany: async () => {
          calls.push('tx.climbingTourAusruestungSchema.deleteMany');
        },
      },
      climbingTourZeitbedarfSchema: {
        upsert: async (input: unknown) => {
          calls.push('tx.climbingTourZeitbedarfSchema.upsert');
          detailUpserts.push(input);
        },
      },
      climbingTourAbsicherungSchema: {
        upsert: async (input: unknown) => {
          calls.push('tx.climbingTourAbsicherungSchema.upsert');
          detailUpserts.push(input);
        },
        deleteMany: async () => {
          calls.push('tx.climbingTourAbsicherungSchema.deleteMany');
        },
      },
      climbingTourSchuhwerkSchema: {
        upsert: async (input: unknown) => {
          calls.push('tx.climbingTourSchuhwerkSchema.upsert');
          detailUpserts.push(input);
        },
        deleteMany: async () => {
          calls.push('tx.climbingTourSchuhwerkSchema.deleteMany');
        },
      },
      climbingTourGelaendeUndGefahrenSchema: {
        upsert: async (input: unknown) => {
          calls.push('tx.climbingTourGelaendeUndGefahrenSchema.upsert');
          detailUpserts.push(input);
        },
      },
      climbingTourKletternSchema: {
        upsert: async (input: unknown) => {
          calls.push('tx.climbingTourKletternSchema.upsert');
          detailUpserts.push(input);
        },
      },
      climbingTourAnreiseSchema: {
        upsert: async (input: unknown) => {
          calls.push('tx.climbingTourAnreiseSchema.upsert');
          detailUpserts.push(input);
        },
      },
      climbingTourZustiegUndAbstiegSchema: {
        deleteMany: async () => {
          calls.push('tx.climbingTourZustiegUndAbstiegSchema.deleteMany');
        },
      },
      climbingTourStuetzpunktSchema: {
        upsert: async (input: unknown) => {
          calls.push('tx.climbingTourStuetzpunktSchema.upsert');
          detailUpserts.push(input);
        },
      },
      climbingTourQuellenSchema: {
        upsert: async (input: unknown) => {
          calls.push('tx.climbingTourQuellenSchema.upsert');
          detailUpserts.push(input);
        },
      },
      climbingTourBerichtsqualitaetSchema: {
        upsert: async (input: unknown) => {
          calls.push('tx.climbingTourBerichtsqualitaetSchema.upsert');
          detailUpserts.push(input);
        },
      },
      climbingTourBesonderesSchema: {
        upsert: async (input: unknown) => {
          calls.push('tx.climbingTourBesonderesSchema.upsert');
          detailUpserts.push(input);
        },
        deleteMany: async () => {
          calls.push('tx.climbingTourBesonderesSchema.deleteMany');
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
    await database.upsertClimbingTourDetails({
      reportId: 42n,
      schemaVersion: 'climbing-extraction-v1',
      zusammenfassung:
        'Die Tour bietet gut abgesicherte Plattenkletterei mit kurzem Zustieg und klarer Linie.',
      ausruestung: {
        seil: {
          art: 'anders',
          anders: 'Doppelseil',
          laenge_m: 50,
        },
      },
      zeitbedarf: {
        zustieg_min: 45,
      },
      absicherung: {
        charakter: 'plaisir',
        hakentypen: ['bohrhaken', 'anders'],
        hakentypen_anders: ['Bühlerhaken'],
      },
      schuhwerk: {
        zustieg: {
          typ: 'anders',
          anders: 'Trailrunner',
        },
        klettern: {
          typ: 'anders',
          anders: 'Kletterfinken',
        },
        abstieg: {
          typ: 'zustiegsschuhe',
        },
      },
      gelaende_und_gefahren: {
        charakter: {
          felsart: 'anders',
          anders: 'Marmor',
        },
        felsqualitaet: ['griffig', 'kompakt'],
      },
      klettern: {
        schluesselstellen: {
          stellen: [{ wo: '2. Seillänge', beschreibung: 'Platte' }],
        },
        charakter: {
          kletterstil: ['platte', 'anders'],
          anders: ['Wasserrillenkletterei'],
        },
      },
      anreise: {
        ausgangspunkt: {
          name: 'Breitwald',
          hoehe_m: 1600,
        },
        parkplatz: {
          ort: 'Oberi Bire',
          hoehe_m: 1706,
        },
        talstation: {
          name: 'Talstation Pfadfluh',
          hoehe_m: 1200,
        },
      },
      stuetzpunkt: {
        typ: 'huette',
        mehrtags: true,
      },
      quellen: {
        kletterfuehrer: ['Plaisir West 2012'],
        topo_url: ['https://www.wachauclimbing.net/'],
      },
      berichtsqualitaet: {
        score: 5,
        begruendung: 'Obl. Grade, Topo-Referenz, Sanierungsjahr 2019 und Tourdatum sind vorhanden.',
      },
      besonderes: {
        saisonalitaet: {
          geeignet: [],
          ungeeignet: [],
          anders: undefined,
        },
        hinweise: ['Am Einstieg warten'],
      },
    });

    expect(calls).toEqual([
      'reportBaseSchema.upsert',
      'summitSchema.findMany.summitName',
      'routeSchema.findMany.routeName+routeNames',
      'routeSchema.findMany.cragName',
      '$transaction',
      'tx.summitSchema.findFirst',
      'tx.summitSchema.upsert',
      'tx.routeSchema.upsert',
      'tx.routeSchema.update',
      'tx.climbingTourBaseSchema.upsert',
      '$transaction',
      'tx.routeSchema.upsert',
      'tx.climbingGardenBaseSchema.upsert',
      '$transaction',
      'tx.climbingTourBaseSchema.findUnique',
      'tx.climbingTourBaseSchema.update',
      'tx.climbingTourAusruestungSchema.upsert',
      'tx.climbingTourZeitbedarfSchema.upsert',
      'tx.climbingTourAbsicherungSchema.upsert',
      'tx.climbingTourSchuhwerkSchema.upsert',
      'tx.climbingTourGelaendeUndGefahrenSchema.upsert',
      'tx.climbingTourKletternSchema.upsert',
      'tx.climbingTourAnreiseSchema.upsert',
      'tx.climbingTourZustiegUndAbstiegSchema.deleteMany',
      'tx.climbingTourStuetzpunktSchema.upsert',
      'tx.climbingTourQuellenSchema.upsert',
      'tx.climbingTourBerichtsqualitaetSchema.upsert',
      'tx.climbingTourBesonderesSchema.upsert',
    ]);
    expect(detailUpserts).toMatchObject([
      {
        where: { baseId: 42n },
        create: {
          baseId: 42n,
          seilArt: 'anders',
          seilAnders: 'Doppelseil',
          seilLaengeM: 50,
          mobileAbsicherungNotwendigkeit: [],
          mobileAbsicherungFriends: [],
          mobileAbsicherungKeile: [],
          schlingen: [],
          zusaetzlich: [],
        },
        update: {
          seilArt: 'anders',
          seilAnders: 'Doppelseil',
          seilLaengeM: 50,
          mobileAbsicherungNotwendigkeit: [],
          mobileAbsicherungFriends: [],
          mobileAbsicherungKeile: [],
          schlingen: [],
          zusaetzlich: [],
        },
      },
      {
        where: { baseId: 42n },
        create: {
          baseId: 42n,
          zustiegMin: 45,
          reineKletterzeitMin: null,
          abstiegMin: null,
        },
        update: {
          zustiegMin: 45,
          reineKletterzeitMin: null,
          abstiegMin: null,
        },
      },
      {
        where: { baseId: 42n },
        create: {
          baseId: 42n,
          charakter: 'plaisir',
          hakentypen: ['bohrhaken', 'anders'],
          hakentypenAnders: ['Bühlerhaken'],
        },
        update: {
          charakter: 'plaisir',
          hakentypen: ['bohrhaken', 'anders'],
          hakentypenAnders: ['Bühlerhaken'],
        },
      },
      {
        where: { baseId: 42n },
        create: {
          baseId: 42n,
          zustiegTyp: 'anders',
          zustiegAnders: 'Trailrunner',
          kletternTyp: 'anders',
          kletternAnders: 'Kletterfinken',
          abstiegTyp: 'zustiegsschuhe',
        },
        update: {
          zustiegTyp: 'anders',
          zustiegAnders: 'Trailrunner',
          kletternTyp: 'anders',
          kletternAnders: 'Kletterfinken',
          abstiegTyp: 'zustiegsschuhe',
        },
      },
      {
        where: { baseId: 42n },
        create: {
          baseId: 42n,
          charakterFelsart: 'anders',
          charakterAnders: 'Marmor',
          gefahren: [],
          felsqualitaet: ['griffig', 'kompakt'],
          felsqualitaetAnders: [],
        },
        update: {
          charakterFelsart: 'anders',
          charakterAnders: 'Marmor',
          gefahren: [],
          felsqualitaet: ['griffig', 'kompakt'],
          felsqualitaetAnders: [],
        },
      },
      {
        where: { baseId: 42n },
        create: {
          baseId: 42n,
          schluesselstellenStellen: [{ wo: '2. Seillänge', beschreibung: 'Platte' }],
          charakterKletterstil: ['platte', 'anders'],
          charakterAnders: ['Wasserrillenkletterei'],
        },
        update: {
          schluesselstellenStellen: [{ wo: '2. Seillänge', beschreibung: 'Platte' }],
          charakterKletterstil: ['platte', 'anders'],
          charakterAnders: ['Wasserrillenkletterei'],
        },
      },
      {
        where: { baseId: 42n },
        create: {
          baseId: 42n,
          ausgangspunktName: 'Breitwald',
          ausgangspunktHoeheM: 1600,
          parkplatzOrt: 'Oberi Bire',
          parkplatzHoeheM: 1706,
          talstationName: 'Talstation Pfadfluh',
          talstationHoeheM: 1200,
          oevVerkehrsmittel: [],
        },
        update: {
          ausgangspunktName: 'Breitwald',
          ausgangspunktHoeheM: 1600,
          parkplatzOrt: 'Oberi Bire',
          parkplatzHoeheM: 1706,
          talstationName: 'Talstation Pfadfluh',
          talstationHoeheM: 1200,
          oevVerkehrsmittel: [],
        },
      },
      {
        where: { baseId: 42n },
        create: {
          baseId: 42n,
          typ: 'huette',
          mehrtags: true,
        },
        update: {
          typ: 'huette',
          mehrtags: true,
        },
      },
      {
        where: { baseId: 42n },
        create: {
          baseId: 42n,
          kletterfuehrer: ['Plaisir West 2012'],
          topoUrl: ['https://www.wachauclimbing.net/'],
        },
        update: {
          kletterfuehrer: ['Plaisir West 2012'],
          topoUrl: ['https://www.wachauclimbing.net/'],
        },
      },
      {
        where: { baseId: 42n },
        create: {
          baseId: 42n,
          score: 5,
          begruendung:
            'Obl. Grade, Topo-Referenz, Sanierungsjahr 2019 und Tourdatum sind vorhanden.',
        },
        update: {
          score: 5,
          begruendung:
            'Obl. Grade, Topo-Referenz, Sanierungsjahr 2019 und Tourdatum sind vorhanden.',
        },
      },
      {
        where: { baseId: 42n },
        create: {
          baseId: 42n,
          saisonalitaet: { geeignet: [], ungeeignet: [] },
          hinweise: ['Am Einstieg warten'],
        },
        update: {
          saisonalitaet: { geeignet: [], ungeeignet: [] },
          hinweise: ['Am Einstieg warten'],
        },
      },
    ]);
    expect(climbingTourBaseUpdates).toEqual([
      {
        where: { reportId: 42n },
        data: {
          zusammenfassung:
            'Die Tour bietet gut abgesicherte Plattenkletterei mit kurzem Zustieg und klarer Linie.',
        },
      },
    ]);
    expect(routeUpdates).toEqual([
      {
        where: { id: 7n },
        data: { routeNames: ['Südgrat', 'S-Grat'] },
      },
    ]);
    expect(summitUpserts).toEqual([
      {
        where: {
          summitNameCanton: {
            summitName: 'Gross Turm',
            canton: 'Obwalden',
          },
        },
        create: {
          summitName: 'Gross Turm',
          summitNames: ['Gross Turm'],
          canton: 'Obwalden',
          duplicationRisk: false,
        },
        update: {
          duplicationRisk: false,
        },
      },
    ]);
  });

  test('marks summit duplication risk when the same summit exists in an adjacent canton', async () => {
    const summitFindFirstInputs: unknown[] = [];
    const summitUpserts: unknown[] = [];
    const reportBase = {
      activity: ACTIVITY.CLIMBING,
      subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR,
      canton: 'Solothurn',
    };

    const tx = {
      reportBaseSchema: {
        findUnique: async () => reportBase,
      },
      summitSchema: {
        findFirst: async (input: unknown) => {
          summitFindFirstInputs.push(input);
          return { id: 9n };
        },
        upsert: async (input: unknown) => {
          summitUpserts.push(input);
          return { id: 5n };
        },
      },
      routeSchema: {
        upsert: async () => ({ id: 7n, routeNames: ['Eulengrat'] }),
      },
      climbingTourBaseSchema: {
        upsert: async () => {},
      },
    };

    const prisma = {
      $transaction: async (callback: (transaction: typeof tx) => Promise<void>) => {
        await callback(tx);
      },
    } as unknown as PrismaClient;

    const database = createPostgresDatabase(prisma);

    await database.upsertClimbingTourBase({
      reportId: 42n,
      schemaVersion: CLIMBING_PREPROCESSOR_SCHEMA_VERSION,
      routeName: 'Eulengrat',
      routeNames: ['Eulengrat'],
      summit: 'Eulengrat',
    });

    expect(summitFindFirstInputs).toEqual([
      {
        where: {
          canton: { in: ['Aargau', 'Basel Land', 'Bern', 'Jura'] },
          OR: [{ summitName: 'Eulengrat' }, { summitNames: { has: 'Eulengrat' } }],
        },
        select: { id: true },
      },
    ]);
    expect(summitUpserts).toEqual([
      {
        where: {
          summitNameCanton: {
            summitName: 'Eulengrat',
            canton: 'Solothurn',
          },
        },
        create: {
          summitName: 'Eulengrat',
          summitNames: ['Eulengrat'],
          canton: 'Solothurn',
          duplicationRisk: true,
        },
        update: {
          duplicationRisk: true,
        },
      },
    ]);
  });
});
