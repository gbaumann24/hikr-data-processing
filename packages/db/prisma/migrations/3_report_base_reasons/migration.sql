-- AlterTable
ALTER TABLE "public"."report_base_schema" ADD COLUMN "reasons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
