-- ─── summits: add height_m ────────────────────────────────────────────────────
ALTER TABLE "public"."summits"
  ADD COLUMN IF NOT EXISTS "height_m" INTEGER;

-- ─── climbing_tour_ausruestung_schema: replace 3 booleans with enum + reason ──
ALTER TABLE "public"."climbing_tour_ausruestung_schema"
  DROP COLUMN IF EXISTS "mobile_absicherung_erforderlich",
  DROP COLUMN IF EXISTS "mobile_absicherung_empfohlen",
  DROP COLUMN IF EXISTS "mobile_absicherung_verwendet",
  ADD COLUMN IF NOT EXISTS "mobile_absicherung_notwendigkeit" TEXT,
  ADD COLUMN IF NOT EXISTS "mobile_absicherung_begruendung" TEXT;

-- ─── climbing_tour_absicherung_schema: add charakter ─────────────────────────
ALTER TABLE "public"."climbing_tour_absicherung_schema"
  ADD COLUMN IF NOT EXISTS "charakter" TEXT;

-- ─── climbing_tour_gelaende_und_gefahren_schema: add charakter_beschreibung ───
ALTER TABLE "public"."climbing_tour_gelaende_und_gefahren_schema"
  ADD COLUMN IF NOT EXISTS "charakter_beschreibung" TEXT;

-- ─── climbing_tour_klettern_schema: remove vorhanden, add new columns ─────────
ALTER TABLE "public"."climbing_tour_klettern_schema"
  DROP COLUMN IF EXISTS "schluesselstellen_vorhanden",
  ADD COLUMN IF NOT EXISTS "schwierigkeit_min_klettererfahrung" TEXT,
  ADD COLUMN IF NOT EXISTS "charakter_beschreibung" TEXT,
  ADD COLUMN IF NOT EXISTS "charakter_schoenheit" TEXT,
  ADD COLUMN IF NOT EXISTS "charakter_ernsthaftigkeit" TEXT,
  ADD COLUMN IF NOT EXISTS "charakter_wandhoehe" INTEGER,
  ADD COLUMN IF NOT EXISTS "routenverlauf_einstiegshoehe" INTEGER,
  ADD COLUMN IF NOT EXISTS "seillaengen_info_anzahl_total" INTEGER;

-- ─── climbing_tour_anreise_schema: add von_passhoehe_aus ─────────────────────
ALTER TABLE "public"."climbing_tour_anreise_schema"
  ADD COLUMN IF NOT EXISTS "von_passhoehe_aus" TEXT;

-- ─── climbing_tour_zustieg_und_abstieg_schema: drop verpflegung + add hm ──────
ALTER TABLE "public"."climbing_tour_zustieg_und_abstieg_schema"
  DROP COLUMN IF EXISTS "abstieg_verpflegung_moeglich",
  DROP COLUMN IF EXISTS "abstieg_verpflegung_beschreibung",
  ADD COLUMN IF NOT EXISTS "verpflegung_typ" TEXT,
  ADD COLUMN IF NOT EXISTS "zustieg_hm_aufstieg" INTEGER,
  ADD COLUMN IF NOT EXISTS "zustieg_hm_abstieg" INTEGER,
  ADD COLUMN IF NOT EXISTS "abstieg_hm_aufstieg" INTEGER,
  ADD COLUMN IF NOT EXISTS "abstieg_hm_abstieg" INTEGER;

-- ─── climbing_tour_besonderes_schema: add frequentierung and bedingungen ──────
ALTER TABLE "public"."climbing_tour_besonderes_schema"
  ADD COLUMN IF NOT EXISTS "frequentierung" TEXT,
  ADD COLUMN IF NOT EXISTS "bedingungen" JSONB;

-- ─── climbing_tour_ausruestung_schema: convert notwendigkeit TEXT → JSONB array ─
ALTER TABLE "public"."climbing_tour_ausruestung_schema"
  ALTER COLUMN "mobile_absicherung_notwendigkeit" TYPE JSONB
    USING CASE
      WHEN "mobile_absicherung_notwendigkeit" IS NULL THEN '[]'::jsonb
      ELSE jsonb_build_array("mobile_absicherung_notwendigkeit")
    END,
  ALTER COLUMN "mobile_absicherung_notwendigkeit" SET DEFAULT '[]'::jsonb,
  ALTER COLUMN "mobile_absicherung_notwendigkeit" SET NOT NULL;
