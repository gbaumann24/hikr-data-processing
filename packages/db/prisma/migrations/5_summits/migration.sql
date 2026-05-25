-- CreateTable
CREATE TABLE "public"."summits" (
    "id" BIGSERIAL NOT NULL,
    "summit_name" TEXT NOT NULL,
    "summit_names" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "canton" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "summits_pkey" PRIMARY KEY ("id")
);

-- Backfill one canonical summit row per existing summit/canton pair.
INSERT INTO "public"."summits" ("summit_name", "summit_names", "canton")
SELECT DISTINCT
    "routes"."summit_name",
    ARRAY["routes"."summit_name"]::TEXT[],
    "routes"."canton"
FROM "public"."routes"
WHERE "routes"."summit_name" IS NOT NULL;

-- AlterTable
ALTER TABLE "public"."routes" ADD COLUMN "summit_id" BIGINT;

UPDATE "public"."routes"
SET "summit_id" = "summits"."id"
FROM "public"."summits"
WHERE "routes"."summit_name" = "summits"."summit_name"
  AND "routes"."canton" = "summits"."canton";

-- Replace route uniqueness so route identity references summit identity.
DROP INDEX "public"."routes_activity_route_name_summit_canton_key";
DROP INDEX "public"."routes_activity_start_point_summit_canton_key";

ALTER TABLE "public"."routes" DROP COLUMN "summit_name";

-- CreateIndex
CREATE UNIQUE INDEX "summits_summit_name_canton_key" ON "public"."summits"("summit_name" ASC, "canton" ASC);
CREATE UNIQUE INDEX "routes_activity_route_name_summit_canton_key" ON "public"."routes"("activity" ASC, "route_name" ASC, "summit_id" ASC, "canton" ASC);
CREATE UNIQUE INDEX "routes_activity_start_point_summit_canton_key" ON "public"."routes"("activity" ASC, "start_point" ASC, "summit_id" ASC, "canton" ASC);
CREATE INDEX "routes_summit_id_idx" ON "public"."routes"("summit_id" ASC);

-- AddForeignKey
ALTER TABLE "public"."routes" ADD CONSTRAINT "routes_summit_id_fkey" FOREIGN KEY ("summit_id") REFERENCES "public"."summits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
