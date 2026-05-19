-- CreateTable
CREATE TABLE "public"."routes" (
    "id" BIGSERIAL NOT NULL,
    "activity" TEXT NOT NULL,
    "sub_activity" TEXT,
    "route_name" TEXT,
    "start_point" TEXT,
    "summit_name" TEXT,
    "crag_name" TEXT,
    "canton" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "public"."climbing_tour_base_schema" ADD COLUMN "route_id" BIGINT;

-- Backfill route identities already stored on climbing tour rows.
INSERT INTO "public"."routes" ("activity", "sub_activity", "route_name", "summit_name", "canton")
SELECT DISTINCT
    "report_base_schema"."activity",
    "report_base_schema"."sub_activity",
    "climbing_tour_base_schema"."route_name",
    "climbing_tour_base_schema"."summit",
    "report_base_schema"."kanton"
FROM "public"."climbing_tour_base_schema"
INNER JOIN "public"."report_base_schema"
    ON "report_base_schema"."report_id" = "climbing_tour_base_schema"."report_id"
WHERE "report_base_schema"."activity" IS NOT NULL
  AND "report_base_schema"."kanton" IS NOT NULL
  AND "climbing_tour_base_schema"."route_name" IS NOT NULL
  AND "climbing_tour_base_schema"."summit" IS NOT NULL;

UPDATE "public"."climbing_tour_base_schema"
SET "route_id" = "routes"."id"
FROM "public"."report_base_schema", "public"."routes"
WHERE "report_base_schema"."report_id" = "climbing_tour_base_schema"."report_id"
  AND "routes"."activity" = "report_base_schema"."activity"
  AND "routes"."route_name" = "climbing_tour_base_schema"."route_name"
  AND "routes"."summit_name" = "climbing_tour_base_schema"."summit"
  AND "routes"."canton" = "report_base_schema"."kanton";

ALTER TABLE "public"."climbing_tour_base_schema" ALTER COLUMN "route_id" SET NOT NULL;
ALTER TABLE "public"."climbing_tour_base_schema" DROP COLUMN "route_name";
ALTER TABLE "public"."climbing_tour_base_schema" DROP COLUMN "summit";

-- CreateIndex
CREATE UNIQUE INDEX "routes_activity_route_name_summit_canton_key" ON "public"."routes"("activity" ASC, "route_name" ASC, "summit_name" ASC, "canton" ASC);
CREATE UNIQUE INDEX "routes_activity_start_point_summit_canton_key" ON "public"."routes"("activity" ASC, "start_point" ASC, "summit_name" ASC, "canton" ASC);
CREATE UNIQUE INDEX "routes_activity_sub_activity_crag_name_canton_key" ON "public"."routes"("activity" ASC, "sub_activity" ASC, "crag_name" ASC, "canton" ASC);
CREATE INDEX "climbing_tour_base_schema_route_id_idx" ON "public"."climbing_tour_base_schema"("route_id" ASC);

-- AddForeignKey
ALTER TABLE "public"."climbing_tour_base_schema" ADD CONSTRAINT "climbing_tour_base_schema_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
