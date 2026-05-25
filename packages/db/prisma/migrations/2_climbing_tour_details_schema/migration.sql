-- Replace the old English enrichment tables with the German climbing tour details schema.
DROP TABLE IF EXISTS "public"."climbing_tour_access_schema";
DROP TABLE IF EXISTS "public"."climbing_tour_approach_descent_schema";
DROP TABLE IF EXISTS "public"."climbing_tour_climbing_schema";
DROP TABLE IF EXISTS "public"."climbing_tour_equipment_schema";
DROP TABLE IF EXISTS "public"."climbing_tour_footwear_schema";
DROP TABLE IF EXISTS "public"."climbing_tour_protection_schema";
DROP TABLE IF EXISTS "public"."climbing_tour_special_notes_schema";
DROP TABLE IF EXISTS "public"."climbing_tour_terrain_schema";
DROP TABLE IF EXISTS "public"."climbing_tour_time_requirement_schema";

CREATE TABLE "public"."climbing_tour_ausruestung_schema" (
    "base_id" BIGINT NOT NULL,
    "seil_art" TEXT,
    "seil_laenge_m" INTEGER,
    "mobile_absicherung_erforderlich" BOOLEAN,
    "mobile_absicherung_empfohlen" BOOLEAN,
    "mobile_absicherung_verwendet" BOOLEAN,
    "mobile_absicherung_moeglichkeiten" TEXT,
    "mobile_absicherung_friends" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "mobile_absicherung_keile" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "schlingen" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "expresskarabiner_anzahl" INTEGER,
    "zusaetzlich" JSONB NOT NULL DEFAULT '[]'::jsonb,

    CONSTRAINT "climbing_tour_ausruestung_schema_pkey" PRIMARY KEY ("base_id")
);

CREATE TABLE "public"."climbing_tour_zeitbedarf_schema" (
    "base_id" BIGINT NOT NULL,
    "zustieg_min" INTEGER,
    "reine_kletterzeit_min" INTEGER,
    "abstieg_min" INTEGER,

    CONSTRAINT "climbing_tour_zeitbedarf_schema_pkey" PRIMARY KEY ("base_id")
);

CREATE TABLE "public"."climbing_tour_absicherung_schema" (
    "base_id" BIGINT NOT NULL,
    "hakenabstaende_bewertung" TEXT,
    "hakenabstaende_beschreibung" TEXT,
    "staende_gebohrt" BOOLEAN,
    "staende_beschreibung" TEXT,
    "hakenzustand_bewertung" TEXT,
    "hakenzustand_beschreibung" TEXT,

    CONSTRAINT "climbing_tour_absicherung_schema_pkey" PRIMARY KEY ("base_id")
);

CREATE TABLE "public"."climbing_tour_schuhwerk_schema" (
    "base_id" BIGINT NOT NULL,
    "zustieg_typ" TEXT,
    "klettern_typ" TEXT,
    "abstieg_typ" TEXT,

    CONSTRAINT "climbing_tour_schuhwerk_schema_pkey" PRIMARY KEY ("base_id")
);

CREATE TABLE "public"."climbing_tour_gelaende_und_gefahren_schema" (
    "base_id" BIGINT NOT NULL,
    "charakter_exposition" TEXT,
    "charakter_sonnig" BOOLEAN,
    "charakter_schnell_trocknend" BOOLEAN,
    "charakter_felsart" TEXT,
    "gefahren" JSONB NOT NULL DEFAULT '[]'::jsonb,

    CONSTRAINT "climbing_tour_gelaende_und_gefahren_schema_pkey" PRIMARY KEY ("base_id")
);

CREATE TABLE "public"."climbing_tour_klettern_schema" (
    "base_id" BIGINT NOT NULL,
    "schluesselstellen_vorhanden" BOOLEAN,
    "schluesselstellen_stellen" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "schwierigkeit_verhaeltnis" TEXT,
    "schwierigkeit_beschreibung" TEXT,
    "abseilen_moeglich" BOOLEAN,
    "abseilen_anzahl" INTEGER,
    "abseilen_laengen_m" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "abseilen_zum_einstieg" BOOLEAN,
    "abseilen_abseilpiste" BOOLEAN,
    "charakter_kletterstil" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "routenverlauf_routenfindung" TEXT,
    "routenverlauf_beschreibung" TEXT,
    "routenverlauf_rueckzug_moeglich" BOOLEAN,
    "routenverlauf_rueckzug_beschreibung" TEXT,
    "seillaengen_verbinden_moeglich" BOOLEAN,
    "seillaengen_verbinden_beschreibung" TEXT,
    "seillaengen" JSONB NOT NULL DEFAULT '[]'::jsonb,

    CONSTRAINT "climbing_tour_klettern_schema_pkey" PRIMARY KEY ("base_id")
);

CREATE TABLE "public"."climbing_tour_anreise_schema" (
    "base_id" BIGINT NOT NULL,
    "parkplatz_ort" TEXT,
    "parkplatz_kosten" TEXT,
    "parkplatz_besonderheiten" TEXT,
    "oev_verkehrsmittel" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "oev_endstation" TEXT,
    "oev_luftseilbahn_moeglich" BOOLEAN,
    "oev_anmeldung_noetig" BOOLEAN,

    CONSTRAINT "climbing_tour_anreise_schema_pkey" PRIMARY KEY ("base_id")
);

CREATE TABLE "public"."climbing_tour_zustieg_und_abstieg_schema" (
    "base_id" BIGINT NOT NULL,
    "zustieg_einstiegsfindung" TEXT,
    "zustieg_beschreibung" TEXT,
    "zustieg_schwierigkeit" TEXT,
    "abstieg_fuehrt_zum_einstieg" BOOLEAN,
    "abstieg_verpflegung_moeglich" BOOLEAN,
    "abstieg_verpflegung_beschreibung" TEXT,
    "abstieg_schwierigkeit" TEXT,

    CONSTRAINT "climbing_tour_zustieg_und_abstieg_schema_pkey" PRIMARY KEY ("base_id")
);

CREATE TABLE "public"."climbing_tour_besonderes_schema" (
    "base_id" BIGINT NOT NULL,
    "saisonalitaet" TEXT,
    "hinweise" JSONB NOT NULL DEFAULT '[]'::jsonb,

    CONSTRAINT "climbing_tour_besonderes_schema_pkey" PRIMARY KEY ("base_id")
);

ALTER TABLE "public"."climbing_tour_ausruestung_schema" ADD CONSTRAINT "climbing_tour_ausruestung_schema_base_id_fkey" FOREIGN KEY ("base_id") REFERENCES "public"."climbing_tour_base_schema"("report_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."climbing_tour_zeitbedarf_schema" ADD CONSTRAINT "climbing_tour_zeitbedarf_schema_base_id_fkey" FOREIGN KEY ("base_id") REFERENCES "public"."climbing_tour_base_schema"("report_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."climbing_tour_absicherung_schema" ADD CONSTRAINT "climbing_tour_absicherung_schema_base_id_fkey" FOREIGN KEY ("base_id") REFERENCES "public"."climbing_tour_base_schema"("report_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."climbing_tour_schuhwerk_schema" ADD CONSTRAINT "climbing_tour_schuhwerk_schema_base_id_fkey" FOREIGN KEY ("base_id") REFERENCES "public"."climbing_tour_base_schema"("report_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."climbing_tour_gelaende_und_gefahren_schema" ADD CONSTRAINT "climbing_tour_gelaende_und_gefahren_schema_base_id_fkey" FOREIGN KEY ("base_id") REFERENCES "public"."climbing_tour_base_schema"("report_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."climbing_tour_klettern_schema" ADD CONSTRAINT "climbing_tour_klettern_schema_base_id_fkey" FOREIGN KEY ("base_id") REFERENCES "public"."climbing_tour_base_schema"("report_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."climbing_tour_anreise_schema" ADD CONSTRAINT "climbing_tour_anreise_schema_base_id_fkey" FOREIGN KEY ("base_id") REFERENCES "public"."climbing_tour_base_schema"("report_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."climbing_tour_zustieg_und_abstieg_schema" ADD CONSTRAINT "climbing_tour_zustieg_und_abstieg_schema_base_id_fkey" FOREIGN KEY ("base_id") REFERENCES "public"."climbing_tour_base_schema"("report_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."climbing_tour_besonderes_schema" ADD CONSTRAINT "climbing_tour_besonderes_schema_base_id_fkey" FOREIGN KEY ("base_id") REFERENCES "public"."climbing_tour_base_schema"("report_id") ON DELETE CASCADE ON UPDATE CASCADE;
