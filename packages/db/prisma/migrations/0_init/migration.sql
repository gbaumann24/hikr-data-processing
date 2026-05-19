-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog" VERSION "1.0";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "public" VERSION "0.8.2";

-- CreateEnum
CREATE TYPE "public"."hikr_category" AS ENUM ('ski', 'alp', 'ped', 'esc', 'raq', 'via', 'mtb');

-- CreateTable
CREATE TABLE "public"."climbing_garden_base_schema" (
    "report_id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "climbing_garden_base_schema_pkey" PRIMARY KEY ("report_id")
);

-- CreateTable
CREATE TABLE "public"."climbing_tour_access_schema" (
    "base_id" BIGINT NOT NULL,
    "parking_location_value" TEXT,
    "parking_costs_value" TEXT,
    "parking_special_features_value" TEXT,
    "public_transport_type_value" TEXT,
    "public_transport_station_value" TEXT,
    "public_transport_cable_car_value" TEXT,
    "public_transport_registration_value" TEXT,

    CONSTRAINT "climbing_tour_access_schema_pkey" PRIMARY KEY ("base_id")
);

-- CreateTable
CREATE TABLE "public"."climbing_tour_approach_descent_schema" (
    "base_id" BIGINT NOT NULL,
    "descent_summit_elevation_meters_value" INTEGER,
    "descent_same_as_approach_value" TEXT,
    "descent_refreshment_value" TEXT,
    "descent_refreshment_description_value" TEXT,
    "descent_difficulty_value" TEXT,
    "approach_start_elevation_meters_value" INTEGER,
    "approach_route_finding_value" TEXT,
    "approach_description_value" TEXT,
    "approach_difficulty_value" TEXT,

    CONSTRAINT "climbing_tour_approach_descent_schema_pkey" PRIMARY KEY ("base_id")
);

-- CreateTable
CREATE TABLE "public"."climbing_tour_base_schema" (
    "report_id" BIGINT NOT NULL,
    "schema_version" TEXT NOT NULL,
    "route_name" TEXT NOT NULL,
    "summit" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "climbing_tour_base_schema_pkey" PRIMARY KEY ("report_id")
);

-- CreateTable
CREATE TABLE "public"."climbing_tour_climbing_schema" (
    "base_id" BIGINT NOT NULL,
    "crux_present_value" TEXT,
    "crux_location_value" TEXT,
    "crux_difficulty_value" TEXT,
    "climbing_difficulty_relation_value" TEXT,
    "climbing_difficulty_reason_value" TEXT,
    "rappelling_possible_value" TEXT,
    "rappel_count_value" INTEGER,
    "rappel_lengths_value" TEXT,
    "rappel_to_start_value" TEXT,
    "rappel_route_value" TEXT,
    "climbing_style_value" JSONB,
    "route_finding_value" TEXT,
    "route_finding_description_value" TEXT,
    "exit_options_value" TEXT,
    "exit_description_value" TEXT,
    "pitch_linking_possible_value" TEXT,
    "pitch_linking_description_value" TEXT,
    "pitch_description" JSONB,

    CONSTRAINT "climbing_tour_climbing_schema_pkey" PRIMARY KEY ("base_id")
);

-- CreateTable
CREATE TABLE "public"."climbing_tour_equipment_schema" (
    "base_id" BIGINT NOT NULL,
    "rope_type_value" TEXT,
    "rope_length_meters_value" INTEGER,
    "mobile_protection_required_value" TEXT,
    "mobile_friends_count_per_size_value" JSONB,
    "mobile_friends_sizes_value" JSONB,
    "mobile_nuts_count_per_size_value" JSONB,
    "mobile_nuts_sizes_value" JSONB,
    "mobile_slings_lengths_value" JSONB,
    "mobile_slings_count_per_length_value" JSONB,
    "mobile_quickdraws_count_value" INTEGER,
    "mobile_protection_options_value" TEXT,
    "additional_equipment_value" JSONB,

    CONSTRAINT "climbing_tour_equipment_schema_pkey" PRIMARY KEY ("base_id")
);

-- CreateTable
CREATE TABLE "public"."climbing_tour_footwear_schema" (
    "base_id" BIGINT NOT NULL,
    "approach_footwear_type_value" TEXT,
    "climbing_footwear_type_value" TEXT,
    "descent_footwear_type_value" TEXT,

    CONSTRAINT "climbing_tour_footwear_schema_pkey" PRIMARY KEY ("base_id")
);

-- CreateTable
CREATE TABLE "public"."climbing_tour_protection_schema" (
    "base_id" BIGINT NOT NULL,
    "bolt_spacing_type_value" TEXT,
    "belay_stations_value" TEXT,
    "bolt_condition_type_value" TEXT,
    "bolt_condition_description_value" TEXT,

    CONSTRAINT "climbing_tour_protection_schema_pkey" PRIMARY KEY ("base_id")
);

-- CreateTable
CREATE TABLE "public"."climbing_tour_special_notes_schema" (
    "base_id" BIGINT NOT NULL,
    "seasonality_value" TEXT,

    CONSTRAINT "climbing_tour_special_notes_schema_pkey" PRIMARY KEY ("base_id")
);

-- CreateTable
CREATE TABLE "public"."climbing_tour_terrain_schema" (
    "base_id" BIGINT NOT NULL,
    "route_type_value" JSONB,
    "exposure_value" TEXT,
    "sun_value" TEXT,
    "dries_quickly_value" TEXT,
    "rock_type_value" TEXT,
    "hazards" JSONB,

    CONSTRAINT "climbing_tour_terrain_schema_pkey" PRIMARY KEY ("base_id")
);

-- CreateTable
CREATE TABLE "public"."climbing_tour_time_requirement_schema" (
    "base_id" BIGINT NOT NULL,
    "pure_climbing_time_minutes_value" TEXT,
    "descent_minutes_value" TEXT,
    "approach_minutes_value" TEXT,

    CONSTRAINT "climbing_tour_time_requirement_schema_pkey" PRIMARY KEY ("base_id")
);

-- CreateTable
CREATE TABLE "public"."hikr_report_wegpunkt" (
    "report_id" BIGINT NOT NULL,
    "wegpunkt_id" TEXT NOT NULL,
    "position" SMALLINT NOT NULL,

    CONSTRAINT "hikr_report_wegpunkt_pkey" PRIMARY KEY ("report_id","position")
);

-- CreateTable
CREATE TABLE "public"."hikr_reports" (
    "id" BIGSERIAL NOT NULL,
    "hikr_post_id" INTEGER NOT NULL,
    "post_url" TEXT NOT NULL,
    "title" TEXT,
    "category" "public"."hikr_category" NOT NULL,
    "region_path_csv" TEXT,
    "tour_date" DATE,
    "wandern_schwierigkeit" TEXT,
    "hochtouren_schwierigkeit" TEXT,
    "klettern_schwierigkeit" TEXT,
    "schneeschuhtouren_schwierigkeit" TEXT,
    "klettersteig_schwierigkeit" TEXT,
    "ski_schwierigkeit" TEXT,
    "eisklettern_schwierigkeit" TEXT,
    "mountainbike_schwierigkeit" TEXT,
    "zeitbedarf" INTEGER,
    "aufstieg" INTEGER,
    "abstieg" INTEGER,
    "strecke" TEXT,
    "kartennummer" TEXT,
    "unterkunftmoeglichkeiten" TEXT,
    "zufahrt_ausgangspunkt" TEXT,
    "zufahrt_ankunftspunkt" TEXT,
    "zufahrt_ausgangspunkt_sbb" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "zufahrt_ankunftspunkt_sbb" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "geotags_csv" TEXT,
    "description" TEXT,
    "geodata" JSONB,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scraped_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hikr_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."hikr_scraper_progress" (
    "id" SERIAL NOT NULL,
    "session_id" TEXT NOT NULL,
    "category" "public"."hikr_category" NOT NULL,
    "current_page" INTEGER NOT NULL DEFAULT 1,
    "current_skip" INTEGER NOT NULL DEFAULT 0,
    "last_processed_post_id" INTEGER,
    "last_processed_url" TEXT,
    "total_processed" INTEGER NOT NULL DEFAULT 0,
    "total_skipped" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hikr_scraper_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."hikr_wegpunkt" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "height_m" INTEGER,
    "additional_info" TEXT,
    "icon_type" TEXT,
    "coordinates_text" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "ch_x" INTEGER,
    "ch_y" INTEGER,
    "url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hikr_wegpunkt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."report_base_schema" (
    "report_id" BIGINT NOT NULL,
    "status" TEXT NOT NULL,
    "activity" TEXT,
    "sub_activity" TEXT,
    "kanton" TEXT,
    "tour_date" DATE,
    "region" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_base_schema_pkey" PRIMARY KEY ("report_id")
);

-- CreateIndex
CREATE INDEX "hikr_report_wegpunkt_wid_idx" ON "public"."hikr_report_wegpunkt"("wegpunkt_id" ASC);

-- CreateIndex
CREATE INDEX "hikr_reports_category_idx" ON "public"."hikr_reports"("category" ASC);

-- CreateIndex
CREATE INDEX "hikr_reports_geodata_gin" ON "public"."hikr_reports" USING GIN ("geodata" jsonb_ops ASC);

-- CreateIndex
CREATE UNIQUE INDEX "hikr_reports_hikr_post_id_key" ON "public"."hikr_reports"("hikr_post_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "hikr_reports_post_url_key" ON "public"."hikr_reports"("post_url" ASC);

-- CreateIndex
CREATE INDEX "hikr_reports_tour_date_idx" ON "public"."hikr_reports"("tour_date" ASC);

-- CreateIndex
CREATE INDEX "hikr_scraper_progress_category_idx" ON "public"."hikr_scraper_progress"("category" ASC);

-- CreateIndex
CREATE INDEX "hikr_scraper_progress_session_idx" ON "public"."hikr_scraper_progress"("session_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "unique_session_category" ON "public"."hikr_scraper_progress"("session_id" ASC, "category" ASC);

-- AddForeignKey
ALTER TABLE "public"."climbing_garden_base_schema" ADD CONSTRAINT "climbing_garden_base_schema_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."report_base_schema"("report_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."climbing_tour_access_schema" ADD CONSTRAINT "climbing_tour_access_schema_base_id_fkey" FOREIGN KEY ("base_id") REFERENCES "public"."climbing_tour_base_schema"("report_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."climbing_tour_approach_descent_schema" ADD CONSTRAINT "climbing_tour_approach_descent_schema_base_id_fkey" FOREIGN KEY ("base_id") REFERENCES "public"."climbing_tour_base_schema"("report_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."climbing_tour_base_schema" ADD CONSTRAINT "climbing_tour_base_schema_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."report_base_schema"("report_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."climbing_tour_climbing_schema" ADD CONSTRAINT "climbing_tour_climbing_schema_base_id_fkey" FOREIGN KEY ("base_id") REFERENCES "public"."climbing_tour_base_schema"("report_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."climbing_tour_equipment_schema" ADD CONSTRAINT "climbing_tour_equipment_schema_base_id_fkey" FOREIGN KEY ("base_id") REFERENCES "public"."climbing_tour_base_schema"("report_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."climbing_tour_footwear_schema" ADD CONSTRAINT "climbing_tour_footwear_schema_base_id_fkey" FOREIGN KEY ("base_id") REFERENCES "public"."climbing_tour_base_schema"("report_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."climbing_tour_protection_schema" ADD CONSTRAINT "climbing_tour_protection_schema_base_id_fkey" FOREIGN KEY ("base_id") REFERENCES "public"."climbing_tour_base_schema"("report_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."climbing_tour_special_notes_schema" ADD CONSTRAINT "climbing_tour_special_notes_schema_base_id_fkey" FOREIGN KEY ("base_id") REFERENCES "public"."climbing_tour_base_schema"("report_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."climbing_tour_terrain_schema" ADD CONSTRAINT "climbing_tour_terrain_schema_base_id_fkey" FOREIGN KEY ("base_id") REFERENCES "public"."climbing_tour_base_schema"("report_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."climbing_tour_time_requirement_schema" ADD CONSTRAINT "climbing_tour_time_requirement_schema_base_id_fkey" FOREIGN KEY ("base_id") REFERENCES "public"."climbing_tour_base_schema"("report_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hikr_report_wegpunkt" ADD CONSTRAINT "hikr_report_wegpunkt_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."hikr_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hikr_report_wegpunkt" ADD CONSTRAINT "hikr_report_wegpunkt_wegpunkt_id_fkey" FOREIGN KEY ("wegpunkt_id") REFERENCES "public"."hikr_wegpunkt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report_base_schema" ADD CONSTRAINT "report_base_schema_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."hikr_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

