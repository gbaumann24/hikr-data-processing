ALTER TABLE "public"."climbing_tour_besonderes_schema"
ALTER COLUMN "saisonalitaet" TYPE JSONB
USING CASE
  WHEN "saisonalitaet" IS NULL THEN NULL
  ELSE to_jsonb("saisonalitaet")
END;
