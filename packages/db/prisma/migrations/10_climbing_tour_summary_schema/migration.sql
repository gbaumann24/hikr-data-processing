-- ─── climbing_tour_base_schema: one-sentence tour summary ───────────────────
ALTER TABLE "public"."climbing_tour_base_schema"
  ADD COLUMN IF NOT EXISTS "zusammenfassung" TEXT;
