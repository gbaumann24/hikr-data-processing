-- climbing_tour_aggregate_schema: route-level extraction aggregation
CREATE TABLE IF NOT EXISTS "public"."climbing_tour_aggregate_schema" (
  "route_id" BIGINT NOT NULL,
  "schema_version" TEXT NOT NULL,
  "source_report_count" INTEGER NOT NULL,
  "source_report_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "agent_status" TEXT NOT NULL,
  "agent_error_message" TEXT,
  "agent_error_details" JSONB,
  "payload" JSONB NOT NULL,
  "aggregated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "climbing_tour_aggregate_schema_pkey" PRIMARY KEY ("route_id"),
  CONSTRAINT "climbing_tour_aggregate_schema_route_id_fkey"
    FOREIGN KEY ("route_id")
    REFERENCES "public"."routes"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- climbing_tour_berichtsqualitaet_schema: deterministic completeness
ALTER TABLE "public"."climbing_tour_berichtsqualitaet_schema"
  ADD COLUMN IF NOT EXISTS "extraction_schema_version" TEXT,
  ADD COLUMN IF NOT EXISTS "vollstaendigkeit_score" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "vollstaendigkeit_filled_fields" INTEGER,
  ADD COLUMN IF NOT EXISTS "vollstaendigkeit_possible_fields" INTEGER;
