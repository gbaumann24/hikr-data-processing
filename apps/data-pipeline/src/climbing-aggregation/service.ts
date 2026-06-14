import {
  deleteStaleClimbingTourAggregates,
  findClimbingTourAggregationReports,
  upsertClimbingTourAggregate,
  type PrismaClient,
} from '@hikr/db';
import {
  CLIMBING_TOUR_AGGREGATION_SCHEMA_VERSION,
  SINGLE_REPORT_COMPLETENESS_THRESHOLD,
  type ClimbingTourAggregationReport,
  type ClimbingTourAggregationSummarizer,
} from './types';
import { buildDeterministicAggregation, mergeAgentOutput } from './deterministic';

export type ClimbingTourAggregationProgressEvent =
  | {
      type: 'route-aggregated';
      routeId: bigint;
      sourceReportCount: number;
      agentStatus: 'success' | 'failed' | 'skipped';
    }
  | {
      type: 'route-skipped';
      routeId: bigint;
      sourceReportCount: number;
      reason: 'single_report_completeness_below_threshold';
    }
  | {
      type: 'stale-deleted';
      count: number;
    };

export type RunClimbingTourAggregationServiceInput = {
  prisma: PrismaClient;
  summarize?: ClimbingTourAggregationSummarizer;
  now?: () => Date;
  onProgress?: (event: ClimbingTourAggregationProgressEvent) => void;
};

export type RunClimbingTourAggregationServiceResult = {
  totalRoutes: number;
  aggregatedRoutes: number;
  skippedRoutes: number;
  staleDeleted: number;
};

export async function runClimbingTourAggregationService({
  prisma,
  summarize,
  now = () => new Date(),
  onProgress,
}: RunClimbingTourAggregationServiceInput): Promise<RunClimbingTourAggregationServiceResult> {
  const reports = await findClimbingTourAggregationReports(prisma);
  const reportsByRoute = groupReportsByRoute(reports);
  const qualifyingRouteIds: bigint[] = [];
  let aggregatedRoutes = 0;
  let skippedRoutes = 0;

  for (const [routeId, routeReports] of reportsByRoute) {
    if (!isRouteEligible(routeReports)) {
      skippedRoutes += 1;
      onProgress?.({
        type: 'route-skipped',
        routeId,
        sourceReportCount: routeReports.length,
        reason: 'single_report_completeness_below_threshold',
      });
      continue;
    }

    qualifyingRouteIds.push(routeId);
    const { payload, agentInput } = buildDeterministicAggregation(routeId, routeReports);
    let agentStatus: 'success' | 'failed' | 'skipped' = summarize ? 'success' : 'skipped';
    let agentErrorMessage: string | null = null;
    let agentErrorDetails: unknown | null = null;

    if (summarize) {
      try {
        mergeAgentOutput(payload, await summarize(agentInput));
      } catch (error) {
        agentStatus = 'failed';
        agentErrorMessage = getErrorMessage(error);
        agentErrorDetails = serializeError(error);
      }
    }

    await upsertClimbingTourAggregate(prisma, {
      routeId,
      schemaVersion: CLIMBING_TOUR_AGGREGATION_SCHEMA_VERSION,
      sourceReportCount: routeReports.length,
      sourceReportIds: routeReports.map((report) => report.reportId.toString()),
      agentStatus,
      agentErrorMessage,
      agentErrorDetails,
      payload,
      aggregatedAt: now(),
    });

    aggregatedRoutes += 1;
    onProgress?.({
      type: 'route-aggregated',
      routeId,
      sourceReportCount: routeReports.length,
      agentStatus,
    });
  }

  const staleDeleted = await deleteStaleClimbingTourAggregates(prisma, qualifyingRouteIds);
  onProgress?.({ type: 'stale-deleted', count: staleDeleted });

  return {
    totalRoutes: reportsByRoute.size,
    aggregatedRoutes,
    skippedRoutes,
    staleDeleted,
  };
}

export function isRouteEligible(reports: ClimbingTourAggregationReport[]): boolean {
  if (reports.length === 0) {
    return false;
  }

  if (reports.length > 1) {
    return true;
  }

  return (reports[0].completeness.score ?? 0) > SINGLE_REPORT_COMPLETENESS_THRESHOLD;
}

function groupReportsByRoute(
  reports: ClimbingTourAggregationReport[],
): Map<bigint, ClimbingTourAggregationReport[]> {
  const grouped = new Map<bigint, ClimbingTourAggregationReport[]>();

  for (const report of reports) {
    const routeReports = grouped.get(report.routeId) ?? [];
    routeReports.push(report);
    grouped.set(report.routeId, routeReports);
  }

  return grouped;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function serializeError(error: unknown): unknown {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { message: String(error) };
}
