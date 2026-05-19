import { Database } from 'bun:sqlite';
import type {
  ClimbingDataPipelineDatabase,
  HikrOrgPostBaseLayerInput,
  ReportBaseSchemaWriteInput,
} from '@hikr/shared';

type HikrSqliteRow = {
  id: number;
  title: string | null;
  region_path_csv: string | null;
  tour_date: string | null;
  description: string | null;
  wandern_schwierigkeit: string | null;
  hochtouren_schwierigkeit: string | null;
  klettern_schwierigkeit: string | null;
  schneeschuhtouren_schwierigkeit: string | null;
  klettersteig_schwierigkeit: string | null;
  ski_schwierigkeit: string | null;
  eisklettern_schwierigkeit: string | null;
  mountainbike_schwierigkeit: string | null;
};

function mapRowToPost(row: HikrSqliteRow): HikrOrgPostBaseLayerInput {
  return {
    id: BigInt(row.id),
    title: row.title,
    regionPathCsv: row.region_path_csv,
    description: row.description,
    tourDate: parseSqliteDateOnly(row.tour_date),
    hikingDifficulty: row.wandern_schwierigkeit,
    alpineTourDifficulty: row.hochtouren_schwierigkeit,
    climbingDifficulty: row.klettern_schwierigkeit,
    snowshoeTourDifficulty: row.schneeschuhtouren_schwierigkeit,
    viaFerrataDifficulty: row.klettersteig_schwierigkeit,
    skiDifficulty: row.ski_schwierigkeit,
    iceClimbingDifficulty: row.eisklettern_schwierigkeit,
    mountainBikeDifficulty: row.mountainbike_schwierigkeit,
  };
}

function parseSqliteDateOnly(value: string | null): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

export function createSqliteDatabase(db: Database): ClimbingDataPipelineDatabase {
  return {
    findHikrOrgPostsForPreprocessing() {
      const rows = db
        .query<HikrSqliteRow, []>('SELECT * FROM hikr_reports ORDER BY id')
        .all();
      return rows.map(mapRowToPost);
    },

    upsertReportBase(_input: ReportBaseSchemaWriteInput) {},
    findRouteSummitNames() {
      return [];
    },
    findRouteNames() {
      return [];
    },
    findRouteCragNames() {
      return [];
    },
    upsertClimbingTourBase() {},
    upsertClimbingGardenBase() {},
  };
}
