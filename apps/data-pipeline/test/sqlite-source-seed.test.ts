import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Database } from 'bun:sqlite';
import { describe, expect, test } from 'bun:test';
import type { Prisma, PrismaClient } from '@hikr/db';
import { seedHikrReportsFromSqlite } from '../src/database/sqlite-source-seed';

describe('SQLite source seeding', () => {
  // Verifies that the manual special-case fixture stays small and Furka-specific.
  test('keeps the special-case fixture focused on Furka reports', () => {
    const sqlitePath = join(import.meta.dir, '..', 'fixtures', 'special-case.sqlite');
    const db = new Database(sqlitePath, { readonly: true });

    try {
      const counts = db
        .query<{ total: number; nonFurkaRows: number }, []>(
          `
          SELECT
            COUNT(*) AS total,
            COALESCE(
              SUM(
                CASE
                  WHEN lower(
                    coalesce(title, '') || ' ' ||
                    coalesce(region_path_csv, '') || ' ' ||
                    coalesce(geotags_csv, '') || ' ' ||
                    coalesce(description, '')
                  ) LIKE '%furka%' THEN 0
                  ELSE 1
                END
              ),
              0
            ) AS nonFurkaRows
          FROM hikr_reports
        `,
        )
        .get();

      expect(counts?.total).toBeGreaterThan(0);
      expect(counts?.total).toBeLessThanOrEqual(40);
      expect(counts?.nonFurkaRows).toBe(0);
    } finally {
      db.close();
    }
  });

  test('maps SQLite and ISO timestamps to valid dates', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'hikr-sqlite-source-seed-'));
    const sqlitePath = join(tempDir, 'fixture.sqlite');
    const capturedRows: Prisma.HikrOrgPostSchemaCreateManyInput[] = [];
    const prisma = {
      hikrOrgPostSchema: {
        createMany: async ({ data }: { data: Prisma.HikrOrgPostSchemaCreateManyInput[] }) => {
          capturedRows.push(...data);
          return { count: data.length };
        },
      },
    } as unknown as PrismaClient;

    try {
      const db = new Database(sqlitePath);

      try {
        db.exec(`
          CREATE TABLE hikr_reports (
            id INTEGER PRIMARY KEY,
            hikr_post_id INTEGER UNIQUE NOT NULL,
            post_url TEXT UNIQUE NOT NULL,
            title TEXT,
            category TEXT NOT NULL,
            tour_date TEXT,
            scraped_at TEXT,
            updated_at TEXT
          );
        `);
        db.query(
          `
          INSERT INTO hikr_reports (
            id,
            hikr_post_id,
            post_url,
            title,
            category,
            tour_date,
            scraped_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        ).run(
          1,
          101,
          'https://www.hikr.org/tour/post101.html',
          'SQLite timestamp',
          'esc',
          '2026-05-25',
          '2026-05-25 13:29:54',
          '2026-05-25 13:30:54',
        );
        db.query(
          `
          INSERT INTO hikr_reports (
            id,
            hikr_post_id,
            post_url,
            title,
            category,
            tour_date,
            scraped_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        ).run(
          2,
          102,
          'https://www.hikr.org/tour/post102.html',
          'ISO timestamp',
          'ski',
          '2026-05-25',
          '2026-05-25T13:29:54.123Z',
          '2026-05-25T13:30:54.123Z',
        );
      } finally {
        db.close();
      }

      await expect(seedHikrReportsFromSqlite({ prisma, sqlitePath })).resolves.toEqual({
        insertedRows: 2,
        selectedRows: 2,
      });

      expect(capturedRows.map((row) => formatDateInput(row.scrapedAt))).toEqual([
        '2026-05-25T13:29:54.000Z',
        '2026-05-25T13:29:54.123Z',
      ]);
      expect(capturedRows.map((row) => formatDateInput(row.updatedAt))).toEqual([
        '2026-05-25T13:30:54.000Z',
        '2026-05-25T13:30:54.123Z',
      ]);
    } finally {
      rmSync(tempDir, { force: true, recursive: true });
    }
  });
});

function formatDateInput(value: Date | string | undefined): string | undefined {
  return value instanceof Date ? value.toISOString() : value;
}
