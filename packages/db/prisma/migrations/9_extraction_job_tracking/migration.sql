CREATE TABLE IF NOT EXISTS "public"."extraction_jobs" (
    "id" BIGSERIAL NOT NULL,
    "workflow" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "schema_version" TEXT,
    "limit" INTEGER,
    "total_reports" INTEGER,
    "processed_reports" INTEGER NOT NULL DEFAULT 0,
    "succeeded_reports" INTEGER NOT NULL DEFAULT 0,
    "failed_reports" INTEGER NOT NULL DEFAULT 0,
    "status_counts" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "last_report_id" BIGINT,
    "error_message" TEXT,
    "error_details" JSONB,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMPTZ(6),
    "last_heartbeat_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "extraction_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."extraction_job_reports" (
    "job_id" BIGINT NOT NULL,
    "report_id" BIGINT NOT NULL,
    "status" TEXT NOT NULL,
    "workflow_status" TEXT,
    "preprocessor_status" TEXT,
    "mastra_run_id" TEXT,
    "attempt" INTEGER NOT NULL DEFAULT 0,
    "elapsed_ms" INTEGER,
    "error_message" TEXT,
    "error_details" JSONB,
    "started_at" TIMESTAMPTZ(6),
    "finished_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "extraction_job_reports_pkey" PRIMARY KEY ("job_id","report_id"),
    CONSTRAINT "extraction_job_reports_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."extraction_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "extraction_jobs_workflow_idx" ON "public"."extraction_jobs"("workflow");
CREATE INDEX IF NOT EXISTS "extraction_jobs_status_idx" ON "public"."extraction_jobs"("status");
CREATE INDEX IF NOT EXISTS "extraction_jobs_started_at_idx" ON "public"."extraction_jobs"("started_at");
CREATE INDEX IF NOT EXISTS "extraction_job_reports_report_id_idx" ON "public"."extraction_job_reports"("report_id");
CREATE INDEX IF NOT EXISTS "extraction_job_reports_job_status_idx" ON "public"."extraction_job_reports"("job_id","status");
