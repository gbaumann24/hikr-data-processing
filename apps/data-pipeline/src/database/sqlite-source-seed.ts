import { Database } from 'bun:sqlite';
import type { Prisma, PrismaClient } from '@hikr/db';

type HikrSqliteCategory = 'ski' | 'alp' | 'ped' | 'esc' | 'raq' | 'via' | 'mtb';

type HikrSqliteRow = {
  id: number;
  hikr_post_id: number;
  post_url: string;
  title: string | null;
  category: HikrSqliteCategory;
  region_path_csv: string | null;
  tour_date: string | null;
  wandern_schwierigkeit: string | null;
  hochtouren_schwierigkeit: string | null;
  klettern_schwierigkeit: string | null;
  schneeschuhtouren_schwierigkeit: string | null;
  klettersteig_schwierigkeit: string | null;
  ski_schwierigkeit: string | null;
  eisklettern_schwierigkeit: string | null;
  mountainbike_schwierigkeit: string | null;
  zeitbedarf: number | null;
  aufstieg: number | null;
  abstieg: number | null;
  strecke: string | null;
  kartennummer: string | null;
  unterkunftmoeglichkeiten: string | null;
  zufahrt_ausgangspunkt: string | null;
  zufahrt_ankunftspunkt: string | null;
  zufahrt_ausgangspunkt_sbb: string | null;
  zufahrt_ankunftspunkt_sbb: string | null;
  geotags_csv: string | null;
  description: string | null;
  geodata: string | null;
  images: string | null;
  scraped_at: string | null;
  updated_at: string | null;
};

export type HikrPostSeedResult = {
  selectedRows: number;
  insertedRows: number;
};

const HIKR_CATEGORY_BY_SQLITE_VALUE = {
  ski: 'SKI',
  alp: 'ALP',
  ped: 'PED',
  esc: 'ESC',
  raq: 'RAQ',
  via: 'VIA',
  mtb: 'MTB',
} as const satisfies Record<
  HikrSqliteCategory,
  Prisma.HikrOrgPostSchemaCreateManyInput['category']
>;

export async function seedHikrReportsFromSqlite({
  prisma,
  sqlitePath,
  limit,
}: {
  prisma: PrismaClient;
  sqlitePath: string;
  limit?: number;
}): Promise<HikrPostSeedResult> {
  const sqlite = new Database(sqlitePath, { readonly: true });

  try {
    const baseQuery = 'SELECT * FROM hikr_reports ORDER BY id ASC, hikr_post_id ASC';
    const rows =
      limit === undefined
        ? sqlite.query<HikrSqliteRow, []>(baseQuery).all()
        : sqlite.query<HikrSqliteRow, [number]>(`${baseQuery} LIMIT ?`).all(limit);

    if (rows.length === 0) {
      return { selectedRows: 0, insertedRows: 0 };
    }

    const result = await prisma.hikrOrgPostSchema.createMany({
      data: rows.map(mapSqliteRowToPrismaCreateInput),
    });

    return {
      selectedRows: rows.length,
      insertedRows: result.count,
    };
  } finally {
    sqlite.close();
  }
}

function mapSqliteRowToPrismaCreateInput(
  row: HikrSqliteRow,
): Prisma.HikrOrgPostSchemaCreateManyInput {
  return {
    id: BigInt(row.id),
    hikrPostId: row.hikr_post_id,
    postUrl: row.post_url,
    title: row.title,
    category: HIKR_CATEGORY_BY_SQLITE_VALUE[row.category],
    regionPathCsv: row.region_path_csv,
    tourDate: parseSqliteDateOnly(row.tour_date),
    hikingDifficulty: row.wandern_schwierigkeit,
    alpineTourDifficulty: row.hochtouren_schwierigkeit,
    climbingDifficulty: row.klettern_schwierigkeit,
    snowshoeTourDifficulty: row.schneeschuhtouren_schwierigkeit,
    viaFerrataDifficulty: row.klettersteig_schwierigkeit,
    skiDifficulty: row.ski_schwierigkeit,
    iceClimbingDifficulty: row.eisklettern_schwierigkeit,
    mountainBikeDifficulty: row.mountainbike_schwierigkeit,
    timeRequiredMinutes: row.zeitbedarf,
    ascentMeters: row.aufstieg,
    descentMeters: row.abstieg,
    distance: row.strecke,
    mapNumber: row.kartennummer,
    accommodationOptions: row.unterkunftmoeglichkeiten,
    accessStartPoint: row.zufahrt_ausgangspunkt,
    accessArrivalPoint: row.zufahrt_ankunftspunkt,
    accessStartPointSbb: parseStringArray(row.zufahrt_ausgangspunkt_sbb),
    accessArrivalPointSbb: parseStringArray(row.zufahrt_ankunftspunkt_sbb),
    geotagsCsv: row.geotags_csv,
    description: row.description,
    geodata: parseJson(row.geodata),
    images: parseStringArray(row.images),
    scrapedAt: parseSqliteDateTime(row.scraped_at),
    updatedAt: parseSqliteDateTime(row.updated_at),
  };
}

function parseSqliteDateOnly(value: string | null): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function parseSqliteDateTime(value: string | null): Date | undefined {
  if (!value) {
    return undefined;
  }

  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  const normalizedValue = value.includes('T')
    ? hasTimezone
      ? value
      : `${value}Z`
    : `${value.replace(' ', 'T')}Z`;
  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid SQLite datetime value: ${value}`);
  }

  return date;
}

function parseJson(value: string | null): Prisma.InputJsonValue | undefined {
  if (!value) {
    return undefined;
  }

  return JSON.parse(value) as Prisma.InputJsonValue;
}

function parseStringArray(value: string | null): string[] {
  if (!value) {
    return [];
  }

  const parsed = JSON.parse(value) as unknown;

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter((item): item is string => typeof item === 'string');
}
