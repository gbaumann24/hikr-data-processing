-- ─── climbing_tour_anreise_schema: starting point, parking elevation, talstation ─
ALTER TABLE "public"."climbing_tour_anreise_schema"
  ADD COLUMN IF NOT EXISTS "ausgangspunkt_name" TEXT,
  ADD COLUMN IF NOT EXISTS "ausgangspunkt_hoehe_m" INTEGER,
  ADD COLUMN IF NOT EXISTS "parkplatz_hoehe_m" INTEGER,
  ADD COLUMN IF NOT EXISTS "talstation_name" TEXT,
  ADD COLUMN IF NOT EXISTS "talstation_hoehe_m" INTEGER;

-- ─── climbing_tour_gelaende_und_gefahren_schema: rock quality vocabulary ─────
ALTER TABLE "public"."climbing_tour_gelaende_und_gefahren_schema"
  ADD COLUMN IF NOT EXISTS "felsqualitaet" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "felsqualitaet_anders" JSONB NOT NULL DEFAULT '[]'::jsonb;

-- ─── climbing_tour_stuetzpunkt_schema: huts, bivouac, multi-day context ───────
CREATE TABLE IF NOT EXISTS "public"."climbing_tour_stuetzpunkt_schema" (
  "base_id" BIGINT NOT NULL,
  "typ" TEXT,
  "mehrtags" BOOLEAN,

  CONSTRAINT "climbing_tour_stuetzpunkt_schema_pkey" PRIMARY KEY ("base_id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "pg_constraint"
    WHERE "conname" = 'climbing_tour_stuetzpunkt_schema_base_id_fkey'
  ) THEN
    ALTER TABLE "public"."climbing_tour_stuetzpunkt_schema"
      ADD CONSTRAINT "climbing_tour_stuetzpunkt_schema_base_id_fkey"
      FOREIGN KEY ("base_id")
      REFERENCES "public"."climbing_tour_base_schema"("report_id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

-- ─── climbing_tour_quellen_schema: guidebook and topo references ─────────────
CREATE TABLE IF NOT EXISTS "public"."climbing_tour_quellen_schema" (
  "base_id" BIGINT NOT NULL,
  "kletterfuehrer" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "topo_url" JSONB NOT NULL DEFAULT '[]'::jsonb,

  CONSTRAINT "climbing_tour_quellen_schema_pkey" PRIMARY KEY ("base_id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "pg_constraint"
    WHERE "conname" = 'climbing_tour_quellen_schema_base_id_fkey'
  ) THEN
    ALTER TABLE "public"."climbing_tour_quellen_schema"
      ADD CONSTRAINT "climbing_tour_quellen_schema_base_id_fkey"
      FOREIGN KEY ("base_id")
      REFERENCES "public"."climbing_tour_base_schema"("report_id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;
