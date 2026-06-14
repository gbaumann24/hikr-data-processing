import type { MaybePromise } from '@hikr/types';

export const EXTRACTION_JOB_STATUS = {
  RUNNING: 'running',
  COMPLETED: 'completed',
  COMPLETED_WITH_ERRORS: 'completed_with_errors',
  FAILED: 'failed',
} as const;

export const EXTRACTION_JOB_REPORT_STATUS = {
  RUNNING: 'running',
  SUCCESS: 'success',
  FAILED: 'failed',
  WORKFLOW_FAILED: 'workflow_failed',
} as const;

export type ExtractionJobStatus =
  (typeof EXTRACTION_JOB_STATUS)[keyof typeof EXTRACTION_JOB_STATUS];

export type ExtractionJobReportStatus =
  (typeof EXTRACTION_JOB_REPORT_STATUS)[keyof typeof EXTRACTION_JOB_REPORT_STATUS];

export type ExtractionJobRecord = {
  id: bigint;
  workflow: string;
  status: string;
  schemaVersion: string | null;
  limit: number | null;
  totalReports: number | null;
  processedReports: number;
  succeededReports: number;
  failedReports: number;
  statusCounts: Record<string, number>;
  lastReportId: bigint | null;
  errorMessage: string | null;
  errorDetails: unknown;
  startedAt: Date;
  finishedAt: Date | null;
  lastHeartbeatAt: Date;
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
  status: ExtractionJobReportStatus;
  workflowStatus?: string | null;
  preprocessorStatus?: string | null;
  elapsedMs?: number | null;
  errorMessage?: string | null;
  errorDetails?: unknown;
};

export type FinishExtractionJobInput = {
  jobId: bigint;
  status: ExtractionJobStatus;
  statusCounts: Record<string, number>;
  processedReports: number;
  succeededReports: number;
  failedReports: number;
  lastReportId?: bigint | null;
  errorMessage?: string | null;
  errorDetails?: unknown;
};

export type ExtractionJobTrackingDatabase = {
  createExtractionJob: (input: CreateExtractionJobInput) => MaybePromise<ExtractionJobRecord>;
  findExtractionJob: (jobId: bigint) => MaybePromise<ExtractionJobRecord | null>;
  updateExtractionJobTotals: (input: UpdateExtractionJobTotalsInput) => MaybePromise<void>;
  findTerminalExtractionJobReportIds: (jobId: bigint) => MaybePromise<Set<bigint>>;
  startExtractionJobReport: (input: StartExtractionJobReportInput) => MaybePromise<void>;
  finishExtractionJobReport: (input: FinishExtractionJobReportInput) => MaybePromise<void>;
  finishExtractionJob: (input: FinishExtractionJobInput) => MaybePromise<void>;
};
