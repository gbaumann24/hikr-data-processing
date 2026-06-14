import type { PrismaClient } from '../../../generated/client';
import type {
  ClimbingTourAggregationReportRecord,
  ClimbingTourSeasonality,
  NamedExtractionItem,
} from '../types';

type FriendOrNutItem = { groesse: string | null; anzahl: number | null };
type SlingItem = { laenge_cm: number | null; anzahl: number | null };
type HazardItem = NamedExtractionItem & { beschreibung: string | null };
type CruxItem = { wo: string | null; beschreibung: string | null };
type PitchItem = {
  nummer: number | null;
  schwierigkeit: string | null;
  anzahl_bohrhaken: number | null;
  laenge_m: number | null;
  beschreibung: string | null;
};

export async function findClimbingTourAggregationReports(
  prisma: PrismaClient,
): Promise<ClimbingTourAggregationReportRecord[]> {
  const rows = await prisma.climbingTourBaseSchema.findMany({
    where: {
      berichtsqualitaet: {
        is: {
          extractionSchemaVersion: { not: null },
        },
      },
    },
    include: {
      base: { select: { tourDate: true } },
      ausruestung: true,
      zeitbedarf: true,
      absicherung: true,
      schuhwerk: true,
      gelaendeUndGefahren: true,
      klettern: true,
      anreise: true,
      zustiegUndAbstieg: true,
      stuetzpunkt: true,
      quellen: true,
      berichtsqualitaet: true,
      besonderes: true,
    },
    orderBy: [{ routeId: 'asc' }, { reportId: 'asc' }],
  });

  return rows.map((row) => ({
    routeId: row.routeId,
    reportId: row.reportId,
    tourDate: row.base.tourDate,
    qualityScore: row.berichtsqualitaet?.score ?? null,
    completeness: {
      score: row.berichtsqualitaet?.vollstaendigkeitScore ?? null,
      filledFields: row.berichtsqualitaet?.vollstaendigkeitFilledFields ?? null,
      possibleFields: row.berichtsqualitaet?.vollstaendigkeitPossibleFields ?? null,
    },
    details: {
      reportId: row.reportId,
      schemaVersion: row.berichtsqualitaet?.extractionSchemaVersion ?? row.schemaVersion,
      zusammenfassung: row.zusammenfassung,
      ausruestung: row.ausruestung
        ? {
            seil: {
              art: row.ausruestung.seilArt,
              anders: row.ausruestung.seilAnders,
              laenge_m: row.ausruestung.seilLaengeM,
            },
            mobile_absicherung: {
              notwendigkeit: arrayValue<string>(row.ausruestung.mobileAbsicherungNotwendigkeit),
              begruendung: row.ausruestung.mobileAbsicherungBegruendung,
              moeglichkeiten: row.ausruestung.mobileAbsicherungMoeglichkeiten,
              friends: arrayValue<FriendOrNutItem>(row.ausruestung.mobileAbsicherungFriends),
              keile: arrayValue<FriendOrNutItem>(row.ausruestung.mobileAbsicherungKeile),
            },
            schlingen: arrayValue<SlingItem>(row.ausruestung.schlingen),
            expresskarabiner: { anzahl: row.ausruestung.expresskarabinerAnzahl },
            zusaetzlich: arrayValue<string | NamedExtractionItem>(row.ausruestung.zusaetzlich),
          }
        : undefined,
      zeitbedarf: row.zeitbedarf
        ? {
            zustieg_min: row.zeitbedarf.zustiegMin,
            reine_kletterzeit_min: row.zeitbedarf.reineKletterzeitMin,
            abstieg_min: row.zeitbedarf.abstiegMin,
          }
        : undefined,
      absicherung: row.absicherung
        ? {
            charakter: row.absicherung.charakter,
            hakentypen: arrayValue<string>(row.absicherung.hakentypen),
            hakentypen_anders: arrayValue<string>(row.absicherung.hakentypenAnders),
            hakenabstaende: {
              bewertung: row.absicherung.hakenabstaendeBewertung,
              beschreibung: row.absicherung.hakenabstaendeBeschreibung,
            },
            staende: {
              gebohrt: row.absicherung.staendeGebohrt,
              beschreibung: row.absicherung.staendeBeschreibung,
            },
            hakenzustand: {
              bewertung: row.absicherung.hakenzustandBewertung,
              beschreibung: row.absicherung.hakenzustandBeschreibung,
            },
          }
        : undefined,
      schuhwerk: row.schuhwerk
        ? {
            zustieg: { typ: row.schuhwerk.zustiegTyp, anders: row.schuhwerk.zustiegAnders },
            klettern: { typ: row.schuhwerk.kletternTyp, anders: row.schuhwerk.kletternAnders },
            abstieg: { typ: row.schuhwerk.abstiegTyp, anders: row.schuhwerk.abstiegAnders },
          }
        : undefined,
      gelaende_und_gefahren: row.gelaendeUndGefahren
        ? {
            charakter: {
              exposition: row.gelaendeUndGefahren.charakterExposition,
              sonnig: row.gelaendeUndGefahren.charakterSonnig,
              schnell_trocknend: row.gelaendeUndGefahren.charakterSchnellTrocknend,
              felsart: row.gelaendeUndGefahren.charakterFelsart,
              anders: row.gelaendeUndGefahren.charakterAnders,
              beschreibung: row.gelaendeUndGefahren.charakterBeschreibung,
            },
            gefahren: arrayValue<HazardItem>(row.gelaendeUndGefahren.gefahren),
            felsqualitaet: arrayValue<string>(row.gelaendeUndGefahren.felsqualitaet),
            felsqualitaet_anders: arrayValue<string>(row.gelaendeUndGefahren.felsqualitaetAnders),
          }
        : undefined,
      klettern: row.klettern
        ? {
            schluesselstellen: {
              stellen: arrayValue<CruxItem>(row.klettern.schluesselstellenStellen),
            },
            schwierigkeit: {
              verhaeltnis: row.klettern.schwierigkeitVerhaeltnis,
              beschreibung: row.klettern.schwierigkeitBeschreibung,
              min_klettererfahrung: row.klettern.schwierigkeitMinKlettererfahrung,
            },
            abseilen: {
              moeglich: row.klettern.abseilenMoeglich,
              abseil_max_laenge_m: row.klettern.abseilenMaxLaengeM,
              zum_einstieg: row.klettern.abseilenZumEinstieg,
              abseilpiste: row.klettern.abseilenAbseilpiste,
              beschreibung: row.klettern.abseilenBeschreibung,
            },
            charakter: {
              kletterstil: arrayValue<string>(row.klettern.charakterKletterstil),
              anders: arrayValue<string>(row.klettern.charakterAnders),
              beschreibung: row.klettern.charakterBeschreibung,
              schoenheit: row.klettern.charakterSchoenheit,
              ernsthaftigkeit: row.klettern.charakterErnsthaftigkeit,
              wandhoehe_m: row.klettern.charakterWandhoehe,
            },
            routenverlauf: {
              routenfindung: row.klettern.routenverlaufRoutenfindung,
              beschreibung: row.klettern.routenverlaufBeschreibung,
              rueckzug_moeglich: row.klettern.routenverlaufRueckzugMoeglich,
              rueckzug_beschreibung: row.klettern.routenverlaufRueckzugBeschreibung,
              einstiegshoehe_m: row.klettern.routenverlaufEinstiegshoehe,
            },
            seillaengen_info: {
              anzahl_total: row.klettern.seillaengenInfoAnzahlTotal,
              verbinden: {
                moeglich: row.klettern.seillaengenVerbindenMoeglich,
                beschreibung: row.klettern.seillaengenVerbindenBeschreibung,
              },
              seillaengen: arrayValue<PitchItem>(row.klettern.seillaengen),
            },
          }
        : undefined,
      anreise: row.anreise
        ? {
            ausgangspunkt: {
              name: row.anreise.ausgangspunktName,
              hoehe_m: row.anreise.ausgangspunktHoeheM,
            },
            parkplatz: {
              ort: row.anreise.parkplatzOrt,
              hoehe_m: row.anreise.parkplatzHoeheM,
              kosten: row.anreise.parkplatzKosten,
              besonderheiten: row.anreise.parkplatzBesonderheiten,
            },
            talstation: {
              name: row.anreise.talstationName,
              hoehe_m: row.anreise.talstationHoeheM,
            },
            oev: {
              verkehrsmittel: arrayValue<string | NamedExtractionItem>(
                row.anreise.oevVerkehrsmittel,
              ),
              endstation: row.anreise.oevEndstation,
              luftseilbahn_moeglich: row.anreise.oevLuftseilbahnMoeglich,
              anmeldung_noetig: row.anreise.oevAnmeldungNoetig,
            },
            von_passhoehe_aus: row.anreise.vonPasshoeheAus,
          }
        : undefined,
      zustieg_und_abstieg: row.zustiegUndAbstieg
        ? {
            zustieg: {
              einstiegsfindung: row.zustiegUndAbstieg.zustiegEinstiegsfindung,
              beschreibung: row.zustiegUndAbstieg.zustiegBeschreibung,
              schwierigkeit: row.zustiegUndAbstieg.zustiegSchwierigkeit,
              hm_aufstieg: row.zustiegUndAbstieg.zustiegHmAufstieg,
              hm_abstieg: row.zustiegUndAbstieg.zustiegHmAbstieg,
            },
            abstieg: {
              fuehrt_zum_einstieg: row.zustiegUndAbstieg.abstiegFuehrtZumEinstieg,
              schwierigkeit: row.zustiegUndAbstieg.abstiegSchwierigkeit,
              hm_aufstieg: row.zustiegUndAbstieg.abstiegHmAufstieg,
              hm_abstieg: row.zustiegUndAbstieg.abstiegHmAbstieg,
            },
            verpflegung_typ: row.zustiegUndAbstieg.verpflegungTyp,
          }
        : undefined,
      stuetzpunkt: row.stuetzpunkt
        ? {
            typ: row.stuetzpunkt.typ,
            mehrtags: row.stuetzpunkt.mehrtags,
          }
        : undefined,
      quellen: row.quellen
        ? {
            kletterfuehrer: arrayValue<string>(row.quellen.kletterfuehrer),
            topo_url: arrayValue<string>(row.quellen.topoUrl),
          }
        : undefined,
      berichtsqualitaet: row.berichtsqualitaet
        ? {
            score: row.berichtsqualitaet.score,
            begruendung: row.berichtsqualitaet.begruendung,
          }
        : undefined,
      besonderes: row.besonderes
        ? {
            saisonalitaet: nullableJson<ClimbingTourSeasonality | string>(
              row.besonderes.saisonalitaet,
            ),
            frequentierung: row.besonderes.frequentierung,
            bedingungen: nullableJson<{
              fels_zustand: string | null;
              altschnee_auf_zustieg: boolean | null;
              beschreibung: string | null;
            }>(row.besonderes.bedingungen),
            hinweise: arrayValue<string>(row.besonderes.hinweise),
          }
        : undefined,
    },
  }));
}

function arrayValue<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function nullableJson<T>(value: unknown): T | null {
  return value === null || value === undefined ? null : (value as T);
}
