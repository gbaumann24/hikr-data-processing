import type { Mastra } from '@mastra/core/mastra';
import { RequestContext } from '@mastra/core/request-context';
import { toAsyncIterable } from '@hikr/utils';
import { mapReportBaseToSchemaWrite, type PreprocessorStatus } from '../workflows/baselayer';
import type { ClimbingDataPipelineDatabase } from '@hikr/shared';
import type { ClimbingPreprocessorOutput } from '../workflows/climbing';
import { PREPROCESSOR_STATUS } from '../workflows/baselayer';
import {
  CLIMBING_ROUTE_LOOKUP_CONTEXT_KEY,
  type ClimbingRouteLookup,
} from '../tools/climbing-route-lookup-tool';

export type ClimbingPipelineServiceOptions = {
  mastra: Mastra;
  database: ClimbingDataPipelineDatabase;
  limit?: number;
  onProgress?: (event: ClimbingPipelineProgressEvent) => void;
};

export type ClimbingPipelineServiceResult = {
  total: number;
  statusCounts: Record<PreprocessorStatus, number>;
};

export type ClimbingPipelineProgressEvent =
  | {
      type: 'source-loaded';
      total?: number;
    }
  | {
      type: 'post-start';
      index: number;
      total?: number;
      reportId: bigint;
      title: string | null;
    }
  | {
      type: 'post-success';
      index: number;
      total?: number;
      reportId: bigint;
      status: PreprocessorStatus;
      activity: string | null;
      subActivity: string | null;
      reasons: string[];
      routeName?: string;
      summit?: string;
      gardenName?: string;
      elapsedMs: number;
    }
  | {
      type: 'post-failure';
      index: number;
      total?: number;
      reportId: bigint;
      workflowStatus: string;
      elapsedMs: number;
    }
  | {
      type: 'post-error';
      index: number;
      total?: number;
      reportId: bigint;
      error: unknown;
      elapsedMs: number;
    };

export async function runClimbingPipelineService({
  mastra,
  database,
  limit,
  onProgress,
}: ClimbingPipelineServiceOptions): Promise<ClimbingPipelineServiceResult> {
  const workflow = mastra.getWorkflow('climbing-pipeline');
  const source = await database.findHikrOrgPostsForPreprocessing();
  const plannedTotal = Array.isArray(source)
    ? Math.min(source.length, limit ?? source.length)
    : limit;

  onProgress?.({ type: 'source-loaded', total: plannedTotal });

  let total = 0;
  const statusCounts: Record<PreprocessorStatus, number> = {
    ready: 0,
    skipped: 0,
    insufficient: 0,
  };

  for await (const post of toAsyncIterable(source)) {
    if (limit !== undefined && total >= limit) {
      break;
    }

    const index = total + 1;
    const startedAt = Date.now();
    onProgress?.({
      type: 'post-start',
      index,
      total: plannedTotal,
      reportId: post.id,
      title: post.title,
    });

    const run = await workflow.createRun();
    const requestContext = new RequestContext();
    requestContext.set(CLIMBING_ROUTE_LOOKUP_CONTEXT_KEY, {
      findRouteSummitNames: database.findRouteSummitNames,
      findRouteNames: database.findRouteNames,
      findRouteCragNames: database.findRouteCragNames,
    } satisfies ClimbingRouteLookup);

    try {
      const result = await run.start({ inputData: post, requestContext });

      if (result.status === 'success') {
        const climbing = result.result as ClimbingPreprocessorOutput;
        await database.upsertReportBase(
          mapReportBaseToSchemaWrite(climbing.base, climbing.reasons),
        );

        if (climbing.base.status === PREPROCESSOR_STATUS.READY) {
          if (climbing.climbingTourBase) {
            await database.upsertClimbingTourBase(climbing.climbingTourBase);
          }
          if (climbing.climbingGardenBase) {
            await database.upsertClimbingGardenBase(climbing.climbingGardenBase);
          }
        }

        statusCounts[climbing.base.status] += 1;
        onProgress?.({
          type: 'post-success',
          index,
          total: plannedTotal,
          reportId: post.id,
          status: climbing.base.status,
          activity: climbing.base.activity,
          subActivity: climbing.base.subActivity,
          reasons: climbing.reasons,
          routeName: climbing.climbingTourBase?.routeName,
          summit: climbing.climbingTourBase?.summit,
          gardenName: climbing.climbingGardenBase?.name,
          elapsedMs: Date.now() - startedAt,
        });
      } else {
        onProgress?.({
          type: 'post-failure',
          index,
          total: plannedTotal,
          reportId: post.id,
          workflowStatus: String(result.status),
          elapsedMs: Date.now() - startedAt,
        });
      }
    } catch (error) {
      onProgress?.({
        type: 'post-error',
        index,
        total: plannedTotal,
        reportId: post.id,
        error,
        elapsedMs: Date.now() - startedAt,
      });
      throw error;
    }

    total += 1;
  }

  return { total, statusCounts };
}
