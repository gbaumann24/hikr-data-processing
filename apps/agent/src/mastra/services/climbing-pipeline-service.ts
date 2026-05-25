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
      error?: unknown;
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
    let fatalWorkflowError: Error | undefined;
    requestContext.set(CLIMBING_ROUTE_LOOKUP_CONTEXT_KEY, {
      findRouteSummitNames: database.findRouteSummitNames,
      findRouteNames: database.findRouteNames,
      findRouteCragNames: database.findRouteCragNames,
    } satisfies ClimbingRouteLookup);

    try {
      const result = await run.start({ inputData: post, requestContext });

      if (result.status === 'success') {
        const climbing = result.result as ClimbingPreprocessorOutput;
        await database.upsertReportBase(mapReportBaseToSchemaWrite(climbing.base));

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
        const workflowError = 'error' in result ? result.error : undefined;
        onProgress?.({
          type: 'post-failure',
          index,
          total: plannedTotal,
          reportId: post.id,
          workflowStatus: String(result.status),
          error: workflowError,
          elapsedMs: Date.now() - startedAt,
        });

        if (isFatalUpstreamLlmError(workflowError)) {
          fatalWorkflowError = new Error(formatFatalUpstreamLlmError(workflowError), {
            cause: workflowError,
          });
        }
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

    if (fatalWorkflowError) {
      throw fatalWorkflowError;
    }

    total += 1;
  }

  return { total, statusCounts };
}

const FATAL_UPSTREAM_LLM_STATUS_CODES = new Set([401, 402, 403]);

function isFatalUpstreamLlmError(error: unknown): boolean {
  const statusCode = getErrorNumber(error, 'statusCode');

  if (!statusCode || !FATAL_UPSTREAM_LLM_STATUS_CODES.has(statusCode)) {
    return false;
  }

  return Boolean(getErrorBoolean(error, 'vercel.ai.error') || getErrorString(error, 'url'));
}

function formatFatalUpstreamLlmError(error: unknown): string {
  const statusCode = getErrorNumber(error, 'statusCode');
  const message = getProviderErrorMessage(error);
  const httpStatus = statusCode ? ` with HTTP ${statusCode}` : '';
  const providerMessage = message ? `: ${message}` : '';

  return `Upstream LLM provider rejected the request${httpStatus}${providerMessage}. Check the provider API key or billing before rerunning.`;
}

function getProviderErrorMessage(error: unknown): string | undefined {
  const dataMessage = getNestedErrorMessage(getErrorObject(error, 'data'));

  if (dataMessage) {
    return dataMessage;
  }

  const responseBody = getErrorString(error, 'responseBody');

  if (!responseBody) {
    return error instanceof Error ? error.message : undefined;
  }

  try {
    return getNestedErrorMessage(JSON.parse(responseBody)) ?? responseBody;
  } catch {
    return responseBody;
  }
}

function getNestedErrorMessage(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const error = 'error' in value ? value.error : undefined;

  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const message = 'message' in error ? error.message : undefined;

  return typeof message === 'string' ? message : undefined;
}

function getErrorObject(error: unknown, key: string): object | undefined {
  if (!error || typeof error !== 'object' || !(key in error)) {
    return undefined;
  }

  const value = error[key as keyof typeof error];
  return value && typeof value === 'object' ? value : undefined;
}

function getErrorString(error: unknown, key: string): string | undefined {
  if (!error || typeof error !== 'object' || !(key in error)) {
    return undefined;
  }

  const value = error[key as keyof typeof error];
  return typeof value === 'string' ? value : undefined;
}

function getErrorNumber(error: unknown, key: string): number | undefined {
  if (!error || typeof error !== 'object' || !(key in error)) {
    return undefined;
  }

  const value = error[key as keyof typeof error];
  return typeof value === 'number' ? value : undefined;
}

function getErrorBoolean(error: unknown, key: string): boolean | undefined {
  if (!error || typeof error !== 'object' || !(key in error)) {
    return undefined;
  }

  const value = error[key as keyof typeof error];
  return typeof value === 'boolean' ? value : undefined;
}
