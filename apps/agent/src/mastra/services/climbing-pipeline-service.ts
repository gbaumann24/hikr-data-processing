import type { Mastra } from '@mastra/core/mastra';
import { RequestContext } from '@mastra/core/request-context';
import { toAsyncIterable } from '@hikr/utils';
import { mapReportBaseToSchemaWrite, type PreprocessorStatus } from '../workflows/baselayer';
import {
  EXTRACTION_JOB_REPORT_STATUS,
  EXTRACTION_JOB_STATUS,
  type ClimbingDataPipelineDatabase,
  type ExtractionJobRecord,
} from '@hikr/shared';
import type { ClimbingExtractionOutput } from '../workflows/climbing';
import { CLIMBING_EXTRACTION_SCHEMA_VERSION } from '../workflows/climbing';
import { PREPROCESSOR_STATUS } from '../workflows/baselayer';
import {
  CLIMBING_ROUTE_LOOKUP_CONTEXT_KEY,
  type ClimbingRouteLookup,
} from '../tools/climbing-route-lookup-tool';

export type ClimbingPipelineServiceOptions = {
  mastra: Mastra;
  database: ClimbingDataPipelineDatabase;
  limit?: number;
  extractionJobId?: bigint;
  continueOnError?: boolean;
  onProgress?: (event: ClimbingPipelineProgressEvent) => void;
};

export type ClimbingPipelineServiceResult = {
  total: number;
  statusCounts: Record<PreprocessorStatus, number>;
  extractionJobId: bigint;
  succeeded: number;
  failed: number;
  skippedTerminal: number;
};

type ClimbingWorkflowRunResult =
  | {
      status: 'success';
      result: ClimbingExtractionOutput;
    }
  | {
      status: 'failed' | 'suspended' | 'tripwire';
      error?: unknown;
      tripwire?: unknown;
      steps?: unknown;
    };

export type ClimbingPipelineProgressEvent =
  | {
      type: 'source-loaded';
      total?: number;
      extractionJobId: bigint;
      skippedTerminal: number;
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
      routeNames?: string[];
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
  extractionJobId,
  continueOnError = true,
  onProgress,
}: ClimbingPipelineServiceOptions): Promise<ClimbingPipelineServiceResult> {
  const workflowId = 'climbing-pipeline';
  const workflow = mastra.getWorkflow(workflowId);
  const extractionJob = await resolveExtractionJob(database, {
    extractionJobId,
    limit,
    workflow: workflowId,
  });
  const effectiveLimit = limit ?? extractionJob.limit ?? undefined;
  let total = 0;
  let succeeded = 0;
  let failed = 0;
  let lastReportId: bigint | null = extractionJob.lastReportId;
  const statusCounts: Record<PreprocessorStatus, number> = {
    ready: extractionJob.statusCounts.ready ?? 0,
    skipped: extractionJob.statusCounts.skipped ?? 0,
    insufficient: extractionJob.statusCounts.insufficient ?? 0,
  };

  try {
    const source = await database.findHikrOrgPostsForPreprocessing();
    const terminalReportIds = await database.findTerminalExtractionJobReportIds(extractionJob.id);
    const skippedTerminal = terminalReportIds.size;
    const maxNewReports =
      effectiveLimit === undefined ? undefined : Math.max(effectiveLimit - skippedTerminal, 0);
    const plannedTotal = getPlannedTotal(source, terminalReportIds, maxNewReports);

    await database.updateExtractionJobTotals({
      jobId: extractionJob.id,
      limit: effectiveLimit ?? null,
      totalReports:
        plannedTotal === undefined
          ? (effectiveLimit ?? extractionJob.totalReports)
          : skippedTerminal + plannedTotal,
    });

    onProgress?.({
      type: 'source-loaded',
      total: plannedTotal,
      extractionJobId: extractionJob.id,
      skippedTerminal,
    });

    for await (const post of toAsyncIterable(source)) {
      if (terminalReportIds.has(post.id)) {
        continue;
      }

      if (maxNewReports !== undefined && total >= maxNewReports) {
        break;
      }

      const index = total + 1;
      const startedAt = Date.now();
      lastReportId = post.id;
      onProgress?.({
        type: 'post-start',
        index,
        total: plannedTotal,
        reportId: post.id,
        title: post.title,
      });

      try {
        const run = await workflow.createRun();
        await database.startExtractionJobReport({
          jobId: extractionJob.id,
          reportId: post.id,
          mastraRunId: getMastraRunId(run),
        });
        const requestContext = createClimbingRequestContext(database);
        const result = (await run.start({
          inputData: post,
          requestContext,
        })) as ClimbingWorkflowRunResult;

        if (result.status === 'success') {
          const climbing = result.result;
          await persistSuccessfulClimbingOutput(database, climbing);

          statusCounts[climbing.base.status] += 1;
          succeeded += 1;
          await database.finishExtractionJobReport({
            jobId: extractionJob.id,
            reportId: post.id,
            status: EXTRACTION_JOB_REPORT_STATUS.SUCCESS,
            workflowStatus: result.status,
            preprocessorStatus: climbing.base.status,
            elapsedMs: Date.now() - startedAt,
          });
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
            routeNames: climbing.climbingTourBase?.routeNames,
            summit: climbing.climbingTourBase?.summit,
            gardenName: climbing.climbingGardenBase?.name,
            elapsedMs: Date.now() - startedAt,
          });
        } else {
          failed += 1;
          await database.finishExtractionJobReport({
            jobId: extractionJob.id,
            reportId: post.id,
            status: EXTRACTION_JOB_REPORT_STATUS.WORKFLOW_FAILED,
            workflowStatus: String(result.status),
            elapsedMs: Date.now() - startedAt,
            errorMessage: getWorkflowFailureMessage(result),
            errorDetails: serializeWorkflowFailure(result),
          });
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
        failed += 1;
        await database.finishExtractionJobReport({
          jobId: extractionJob.id,
          reportId: post.id,
          status: EXTRACTION_JOB_REPORT_STATUS.FAILED,
          elapsedMs: Date.now() - startedAt,
          errorMessage: getErrorMessage(error),
          errorDetails: serializeError(error),
        });
        onProgress?.({
          type: 'post-error',
          index,
          total: plannedTotal,
          reportId: post.id,
          error,
          elapsedMs: Date.now() - startedAt,
        });

        if (!continueOnError) {
          await finalizeExtractionJob(database, {
            jobId: extractionJob.id,
            status: EXTRACTION_JOB_STATUS.FAILED,
            statusCounts,
            fallbackProcessedReports: extractionJob.processedReports + total + 1,
            fallbackSucceededReports: extractionJob.succeededReports + succeeded,
            fallbackFailedReports: extractionJob.failedReports + failed,
            lastReportId,
            error,
          });
          throw error;
        }
      }

      total += 1;
    }

    await finalizeExtractionJob(database, {
      jobId: extractionJob.id,
      status:
        failed > 0 ? EXTRACTION_JOB_STATUS.COMPLETED_WITH_ERRORS : EXTRACTION_JOB_STATUS.COMPLETED,
      statusCounts,
      fallbackProcessedReports: extractionJob.processedReports + total,
      fallbackSucceededReports: extractionJob.succeededReports + succeeded,
      fallbackFailedReports: extractionJob.failedReports + failed,
      lastReportId,
    });

    return {
      total,
      statusCounts,
      extractionJobId: extractionJob.id,
      succeeded,
      failed,
      skippedTerminal,
    };
  } catch (error) {
    await finalizeExtractionJob(database, {
      jobId: extractionJob.id,
      status: EXTRACTION_JOB_STATUS.FAILED,
      statusCounts,
      fallbackProcessedReports: extractionJob.processedReports + total,
      fallbackSucceededReports: extractionJob.succeededReports + succeeded,
      fallbackFailedReports: extractionJob.failedReports + failed,
      lastReportId,
      error,
    });

    throw error;
  }
}

// Creates a new extraction job or loads an existing one for resume.
async function resolveExtractionJob(
  database: ClimbingDataPipelineDatabase,
  {
    extractionJobId,
    limit,
    workflow,
  }: {
    extractionJobId?: bigint;
    limit?: number;
    workflow: string;
  },
): Promise<ExtractionJobRecord> {
  if (extractionJobId === undefined) {
    return database.createExtractionJob({
      workflow,
      schemaVersion: CLIMBING_EXTRACTION_SCHEMA_VERSION,
      limit: limit ?? null,
    });
  }

  const job = await database.findExtractionJob(extractionJobId);

  if (!job) {
    throw new Error(`Extraction job ${extractionJobId.toString()} was not found`);
  }

  return job;
}

// Computes how many new reports this invocation intends to process.
function getPlannedTotal<Source extends { id: bigint }>(
  source: Iterable<Source> | AsyncIterable<Source>,
  terminalReportIds: Set<bigint>,
  maxNewReports: number | undefined,
): number | undefined {
  if (!Array.isArray(source)) {
    return maxNewReports;
  }

  const remainingReports = source.filter((post) => !terminalReportIds.has(post.id)).length;
  return Math.min(remainingReports, maxNewReports ?? remainingReports);
}

// Builds the request-scoped route lookup context required by climbing workflow tools.
function createClimbingRequestContext(database: ClimbingDataPipelineDatabase): RequestContext {
  const requestContext = new RequestContext();
  requestContext.set(CLIMBING_ROUTE_LOOKUP_CONTEXT_KEY, {
    findRouteSummitNames: database.findRouteSummitNames,
    findRouteNames: database.findRouteNames,
    findRouteCragNames: database.findRouteCragNames,
    updateSummitHeightIfMissing: database.updateSummitHeightIfMissing,
  } satisfies ClimbingRouteLookup);

  return requestContext;
}

// Persists successful workflow output into the report base and climbing tables.
async function persistSuccessfulClimbingOutput(
  database: ClimbingDataPipelineDatabase,
  climbing: ClimbingExtractionOutput,
): Promise<void> {
  await database.upsertReportBase(mapReportBaseToSchemaWrite(climbing.base, climbing.reasons));

  if (climbing.base.status !== PREPROCESSOR_STATUS.READY) {
    return;
  }

  if (climbing.climbingTourBase) {
    await database.upsertClimbingTourBase(climbing.climbingTourBase);
    if (climbing.extraction) {
      await database.upsertClimbingTourDetails({
        reportId: climbing.climbingTourBase.reportId,
        ...climbing.extraction,
      });
    }
  }

  if (climbing.climbingGardenBase) {
    await database.upsertClimbingGardenBase(climbing.climbingGardenBase);
  }
}

// Finalizes a job after refreshing aggregate counters written by report updates.
async function finalizeExtractionJob(
  database: ClimbingDataPipelineDatabase,
  input: {
    jobId: bigint;
    status: (typeof EXTRACTION_JOB_STATUS)[keyof typeof EXTRACTION_JOB_STATUS];
    statusCounts: Record<PreprocessorStatus, number>;
    fallbackProcessedReports: number;
    fallbackSucceededReports: number;
    fallbackFailedReports: number;
    lastReportId: bigint | null;
    error?: unknown;
  },
): Promise<ExtractionJobRecord | null> {
  const currentJob = await database.findExtractionJob(input.jobId);

  await database.finishExtractionJob({
    jobId: input.jobId,
    status: input.status,
    statusCounts: input.statusCounts,
    processedReports: currentJob?.processedReports ?? input.fallbackProcessedReports,
    succeededReports: currentJob?.succeededReports ?? input.fallbackSucceededReports,
    failedReports: currentJob?.failedReports ?? input.fallbackFailedReports,
    lastReportId: input.lastReportId,
    errorMessage: input.error ? getErrorMessage(input.error) : null,
    errorDetails: input.error ? serializeError(input.error) : undefined,
  });

  return currentJob;
}

// Reads a Mastra run id from current run objects when the installed version exposes one.
function getMastraRunId(run: unknown): string | null {
  if (isRecord(run) && typeof run.runId === 'string') {
    return run.runId;
  }

  return null;
}

// Extracts a concise message from a non-success workflow result.
function getWorkflowFailureMessage(
  result: Exclude<ClimbingWorkflowRunResult, { status: 'success' }>,
): string {
  if ('error' in result && result.error) {
    return getErrorMessage(result.error);
  }

  if ('tripwire' in result && result.tripwire) {
    return `Workflow ended with tripwire status: ${JSON.stringify(result.tripwire)}`;
  }

  return `Workflow ended with status ${String(result.status)}`;
}

// Serializes non-success workflow result details for job report diagnostics.
function serializeWorkflowFailure(
  result: Exclude<ClimbingWorkflowRunResult, { status: 'success' }>,
): Record<string, unknown> {
  return {
    status: result.status,
    error: 'error' in result ? serializeError(result.error) : undefined,
    tripwire: 'tripwire' in result ? result.tripwire : undefined,
    steps: 'steps' in result ? result.steps : undefined,
  };
}

// Extracts a concise message from thrown values.
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (isRecord(error) && typeof error.message === 'string') {
    return error.message;
  }

  return String(error);
}

// Serializes thrown values into JSON-compatible diagnostic data.
function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: serializeUnknownCause(error.cause),
    };
  }

  if (isRecord(error)) {
    return error;
  }

  return { message: String(error) };
}

// Serializes nested error causes without assuming they are Error instances.
function serializeUnknownCause(cause: unknown): unknown {
  if (cause instanceof Error) {
    return {
      name: cause.name,
      message: cause.message,
      stack: cause.stack,
    };
  }

  return cause;
}

// Checks whether an unknown value is a plain record-like object.
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
