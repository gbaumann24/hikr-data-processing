import type {
  HikrOrgPostBaseLayerInput,
  HikrPreprocessorInput,
  ReportBasePreprocessorOutput,
  ReportBaseSchemaWriteInput,
} from './types';
import { normalizeDateOnly } from './utils';

export function mapHikrOrgPostToPreprocessorInput(
  post: HikrOrgPostBaseLayerInput,
): HikrPreprocessorInput {
  return {
    reportId: post.id,
    title: post.title,
    regionPathCsv: post.regionPathCsv,
    description: post.description,
    tourDate: post.tourDate,
    hikingDifficulty: post.hikingDifficulty,
    alpineTourDifficulty: post.alpineTourDifficulty,
    climbingDifficulty: post.climbingDifficulty,
    snowshoeTourDifficulty: post.snowshoeTourDifficulty,
    viaFerrataDifficulty: post.viaFerrataDifficulty,
    skiDifficulty: post.skiDifficulty,
    iceClimbingDifficulty: post.iceClimbingDifficulty,
    mountainBikeDifficulty: post.mountainBikeDifficulty,
  };
}

export function mapReportBaseToSchemaWrite(
  base: ReportBasePreprocessorOutput,
): ReportBaseSchemaWriteInput {
  return {
    reportId: base.reportId,
    status: base.status,
    activity: base.activity,
    subActivity: base.subActivity,
    canton: base.canton,
    tourDate: normalizeDateOnly(base.tourDate),
    region: base.region,
  };
}
