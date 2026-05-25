-- AlterTable
ALTER TABLE "public"."routes" ADD COLUMN "route_names" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Backfill the alias list with the existing canonical route name.
UPDATE "public"."routes"
SET "route_names" = ARRAY["route_name"]::TEXT[]
WHERE "route_name" IS NOT NULL;
