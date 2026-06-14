ALTER TABLE "public"."climbing_tour_ausruestung_schema"
  ADD COLUMN IF NOT EXISTS "seil_anders" TEXT;

ALTER TABLE "public"."climbing_tour_absicherung_schema"
  ADD COLUMN IF NOT EXISTS "hakentypen" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "hakentypen_anders" JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE "public"."climbing_tour_schuhwerk_schema"
  ADD COLUMN IF NOT EXISTS "zustieg_anders" TEXT,
  ADD COLUMN IF NOT EXISTS "klettern_anders" TEXT,
  ADD COLUMN IF NOT EXISTS "abstieg_anders" TEXT;

ALTER TABLE "public"."climbing_tour_gelaende_und_gefahren_schema"
  ADD COLUMN IF NOT EXISTS "charakter_anders" TEXT;

ALTER TABLE "public"."climbing_tour_klettern_schema"
  ADD COLUMN IF NOT EXISTS "charakter_anders" JSONB NOT NULL DEFAULT '[]'::jsonb;
