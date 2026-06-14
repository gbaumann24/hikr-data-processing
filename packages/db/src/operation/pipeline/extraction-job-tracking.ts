import { Prisma, type ExtractionJobSchema, type PrismaClient } from '../../../generated/client';

const RUNNING_JOB_STATUS = 'running';
const RUNNING_REPORT_STATUS = 'running';
const SUCCESS_REPORT_STATUS = 'success';
const FAILED_REPORT_STATUS = 'failed';
const WORKFLOW_FAILED_REPORT_STATUS = 'workflow_failed';
const TERMINAL_REPORT_STATUSES = [
  SUCCESS_REPORT_STATUS,
  FAILED_REPORT_STATUS,
  WORKFLOW_FAILED_REPORT_STATUS,
];

export type ExtractionJobRecord = Omit<ExtractionJobSchema, 'statusCounts'> & {
  statusCounts: Record<string, number>;
};

export type CreateExtractionJobInput = {
  workflow: string;
  schemaVersion?: string | null;
  limit?: number | null;
  totalReports?: number | null;
};

export type UpdateExtractionJobTotalsInput = {
  jobId: bigint;
  totalReports?: number | null;
  limit?: number | null;
};

export type StartExtractionJobReportInput = {
  jobId: bigint;
  reportId: bigint;
  mastraRunId?: string | null;
};

export type FinishExtractionJobReportInput = {
  jobId: bigint;
  reportId: bigint;
  status: string;
  workflowStatus?: string | null;
  preprocessorStatus?: string | null;
  elapsedMs?: number | null;
  errorMessage?: string | null;
  errorDetails?: unknown;
};

export type FinishExtractionJobInput = {
  jobId: bigint;
  status: string;
  statusCounts: Record<string, number>;
  processedReports: number;
  succeededReports: number;
  failedReports: number;
  lastReportId?: bigint | null;
  errorMessage?: string | null;
  errorDetails?: unknown;
};

// Creates a durable extraction job row in the running state.
export async function createExtractionJob(
  prisma: PrismaClient,
  input: CreateExtractionJobInput,
): Promise<ExtractionJobRecord> {
  const job = await prisma.extractionJobSchema.create({
    data: {
      workflow: input.workflow,
      status: RUNNING_JOB_STATUS,
      schemaVersion: input.schemaVersion ?? null,
      limit: input.limit ?? null,
      totalReports: input.totalReports ?? null,
      lastHeartbeatAt: new Date(),
    },
  });

  return mapExtractionJob(job);
}

// Finds an extraction job by id and normalizes its JSON status counts.
export async function findExtractionJob(
  prisma: PrismaClient,
  jobId: bigint,
): Promise<ExtractionJobRecord | null> {
  const job = await prisma.extractionJobSchema.findUnique({
    where: { id: jobId },
  });

  return job ? mapExtractionJob(job) : null;
}

// Updates the planned report total for an existing extraction job.
export async function updateExtractionJobTotals(
  prisma: PrismaClient,
  input: UpdateExtractionJobTotalsInput,
): Promise<void> {
  await prisma.extractionJobSchema.update({
    where: { id: input.jobId },
    data: {
      ...(input.totalReports !== undefined ? { totalReports: input.totalReports } : {}),
      ...(input.limit !== undefined ? { limit: input.limit } : {}),
      status: RUNNING_JOB_STATUS,
      finishedAt: null,
      lastHeartbeatAt: new Date(),
    },
  });
}

// Finds report ids that already reached a terminal state for a job.
export async function findTerminalExtractionJobReportIds(
  prisma: PrismaClient,
  jobId: bigint,
): Promise<Set<bigint>> {
  const reports = await prisma.extractionJobReportSchema.findMany({
    where: {
      jobId,
      status: { in: TERMINAL_REPORT_STATUSES },
    },
    select: { reportId: true },
  });

  return new Set(reports.map((report) => report.reportId));
}

// Marks a report as actively running within an extraction job.
export async function startExtractionJobReport(
  prisma: PrismaClient,
  input: StartExtractionJobReportInput,
): Promise<void> {
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.extractionJobReportSchema.upsert({
      where: {
        jobId_reportId: {
          jobId: input.jobId,
          reportId: input.reportId,
        },
      },
      create: {
        jobId: input.jobId,
        reportId: input.reportId,
        status: RUNNING_REPORT_STATUS,
        mastraRunId: input.mastraRunId ?? null,
        attempt: 1,
        startedAt: now,
      },
      update: {
        status: RUNNING_REPORT_STATUS,
        mastraRunId: input.mastraRunId ?? null,
        attempt: { increment: 1 },
        elapsedMs: null,
        errorMessage: null,
        errorDetails: Prisma.DbNull,
        startedAt: now,
        finishedAt: null,
      },
    });

    await tx.extractionJobSchema.update({
      where: { id: input.jobId },
      data: {
        status: RUNNING_JOB_STATUS,
        lastReportId: input.reportId,
        lastHeartbeatAt: now,
        finishedAt: null,
      },
    });
  });
}

// Marks a report terminal and updates aggregate job progress counters.
export async function finishExtractionJobReport(
  prisma: PrismaClient,
  input: FinishExtractionJobReportInput,
): Promise<void> {
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const previous = await tx.extractionJobReportSchema.findUnique({
      where: {
        jobId_reportId: {
          jobId: input.jobId,
          reportId: input.reportId,
        },
      },
      select: { status: true },
    });
    const previousOutcome = getReportOutcome(previous?.status);
    const nextOutcome = getReportOutcome(input.status);

    await tx.extractionJobReportSchema.upsert({
      where: {
        jobId_reportId: {
          jobId: input.jobId,
          reportId: input.reportId,
        },
      },
      create: {
        jobId: input.jobId,
        reportId: input.reportId,
        status: input.status,
        workflowStatus: input.workflowStatus ?? null,
        preprocessorStatus: input.preprocessorStatus ?? null,
        attempt: 1,
        elapsedMs: input.elapsedMs ?? null,
        errorMessage: input.errorMessage ?? null,
        errorDetails: toJsonNullable(input.errorDetails),
        startedAt: now,
        finishedAt: now,
      },
      update: {
        status: input.status,
        workflowStatus: input.workflowStatus ?? null,
        preprocessorStatus: input.preprocessorStatus ?? null,
        elapsedMs: input.elapsedMs ?? null,
        errorMessage: input.errorMessage ?? null,
        errorDetails: toJsonNullable(input.errorDetails),
        finishedAt: now,
      },
    });

    await tx.extractionJobSchema.update({
      where: { id: input.jobId },
      data: {
        processedReports: { increment: nextOutcome.processed - previousOutcome.processed },
        succeededReports: { increment: nextOutcome.succeeded - previousOutcome.succeeded },
        failedReports: { increment: nextOutcome.failed - previousOutcome.failed },
        lastReportId: input.reportId,
        lastHeartbeatAt: now,
      },
    });
  });
}

// Finalizes an extraction job with the service's aggregate counters and status counts.
export async function finishExtractionJob(
  prisma: PrismaClient,
  input: FinishExtractionJobInput,
): Promise<void> {
  await prisma.extractionJobSchema.update({
    where: { id: input.jobId },
    data: {
      status: input.status,
      processedReports: input.processedReports,
      succeededReports: input.succeededReports,
      failedReports: input.failedReports,
      statusCounts: input.statusCounts,
      lastReportId: input.lastReportId ?? null,
      errorMessage: input.errorMessage ?? null,
      errorDetails: toJsonNullable(input.errorDetails),
      finishedAt: new Date(),
      lastHeartbeatAt: new Date(),
    },
  });
}

// Converts a generated Prisma job row into the shared record shape.
function mapExtractionJob(job: ExtractionJobSchema): ExtractionJobRecord {
  return {
    ...job,
    statusCounts: normalizeStatusCounts(job.statusCounts),
  };
}

// Converts unknown JSON status counts into a numeric record.
function normalizeStatusCounts(value: Prisma.JsonValue): Record<string, number> {
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, count]) => typeof count === 'number')
      .map(([status, count]) => [status, count as number]),
  );
}

// Summarizes a report row status for aggregate counter deltas.
function getReportOutcome(status: string | null | undefined): {
  processed: number;
  succeeded: number;
  failed: number;
} {
  if (status === SUCCESS_REPORT_STATUS) {
    return { processed: 1, succeeded: 1, failed: 0 };
  }

  if (status === FAILED_REPORT_STATUS || status === WORKFLOW_FAILED_REPORT_STATUS) {
    return { processed: 1, succeeded: 0, failed: 1 };
  }

  return { processed: 0, succeeded: 0, failed: 0 };
}

// Converts arbitrary error context into a nullable Prisma JSON value.
function toJsonNullable(value: unknown): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue {
  const jsonValue = stripUndefined(value);
  return jsonValue === undefined || jsonValue === null
    ? Prisma.DbNull
    : (jsonValue as Prisma.InputJsonValue);
}

// Removes undefined object properties so error details can be stored as JSON.
function stripUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item) ?? null);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, nestedValue]) => nestedValue !== undefined)
        .map(([key, nestedValue]) => [key, stripUndefined(nestedValue)]),
    );
  }

  return value;
}
