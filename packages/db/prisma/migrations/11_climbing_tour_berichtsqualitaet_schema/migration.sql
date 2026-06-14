-- ─── climbing_tour_berichtsqualitaet_schema: extractor report quality ───────
CREATE TABLE IF NOT EXISTS "public"."climbing_tour_berichtsqualitaet_schema" (
  "base_id" BIGINT NOT NULL,
  "score" INTEGER,
  "begruendung" TEXT,

  CONSTRAINT "climbing_tour_berichtsqualitaet_schema_pkey" PRIMARY KEY ("base_id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "pg_constraint"
    WHERE "conname" = 'climbing_tour_berichtsqualitaet_schema_base_id_fkey'
  ) THEN
    ALTER TABLE "public"."climbing_tour_berichtsqualitaet_schema"
      ADD CONSTRAINT "climbing_tour_berichtsqualitaet_schema_base_id_fkey"
      FOREIGN KEY ("base_id")
      REFERENCES "public"."climbing_tour_base_schema"("report_id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;
