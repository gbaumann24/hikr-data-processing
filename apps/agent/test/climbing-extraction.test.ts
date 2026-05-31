import { describe, expect, test } from 'bun:test';
import { ACTIVITY, PREPROCESSOR_STATUS } from '../src/mastra/workflows/baselayer';
import {
  CLIMBING_EXTRACTION_SCHEMA_VERSION,
  CLIMBING_PREPROCESSOR_SCHEMA_VERSION,
  CLIMBING_SUB_ACTIVITY,
  createMastraClimbingExtractor,
  extractPreparedClimbingReport,
  type ClimbingExtractionAgentResult,
  type ClimbingPreprocessorOutput,
} from '../src/mastra/workflows/climbing';

function climbingOutput(
  overrides: Partial<ClimbingPreprocessorOutput> = {},
): ClimbingPreprocessorOutput {
  return {
    base: {
      reportId: 42n,
      status: PREPROCESSOR_STATUS.READY,
      activity: ACTIVITY.CLIMBING,
      subActivity: CLIMBING_SUB_ACTIVITY.CLIMBING_TOUR,
      canton: 'Obwalden',
      tourDate: new Date('2024-08-10T00:00:00.000Z'),
      region: 'Melchtal',
    },
    climbingTourBase: {
      reportId: 42n,
      schemaVersion: CLIMBING_PREPROCESSOR_SCHEMA_VERSION,
      routeName: 'Sudgrat',
      routeNames: ['Sudgrat'],
      summit: 'Gross Turm',
    },
    climbingGardenBase: null,
    normalizedDescription: 'Kletterbericht '.repeat(150),
    normalizedDescriptionLength: 'Kletterbericht '.repeat(150).length,
    reasons: ['ready'],
    skipReason: null,
    ...overrides,
  };
}

function emptyExtractionOutput(): ClimbingExtractionAgentResult {
  return {
    schemaVersion: CLIMBING_EXTRACTION_SCHEMA_VERSION,
    ausruestung: {
      seil: { art: null, laenge_m: null },
      mobile_absicherung: {
        erforderlich: null,
        empfohlen: null,
        verwendet: null,
        moeglichkeiten: null,
        friends: [],
        keile: [],
      },
      schlingen: [],
      expresskarabiner: { anzahl: null },
      zusaetzlich: [],
    },
    zeitbedarf: {
      zustieg_min: null,
      reine_kletterzeit_min: null,
      abstieg_min: null,
    },
    absicherung: {
      hakenabstaende: { bewertung: null, beschreibung: null },
      staende: { gebohrt: null, beschreibung: null },
      hakenzustand: { bewertung: null, beschreibung: null },
    },
    schuhwerk: {
      zustieg: { typ: null },
      klettern: { typ: null },
      abstieg: { typ: null },
    },
    gelaende_und_gefahren: {
      charakter: {
        exposition: null,
        sonnig: null,
        schnell_trocknend: null,
        felsart: null,
      },
      gefahren: [],
    },
    klettern: {
      schluesselstellen: {
        vorhanden: null,
        stellen: [],
      },
      schwierigkeit: {
        verhaeltnis: null,
        beschreibung: null,
      },
      abseilen: {
        moeglich: null,
        anzahl: null,
        laengen_m: [],
        zum_einstieg: null,
        abseilpiste: null,
      },
      charakter: {
        kletterstil: [],
      },
      routenverlauf: {
        routenfindung: null,
        beschreibung: null,
        rueckzug_moeglich: null,
        rueckzug_beschreibung: null,
      },
      seillaengen_verbinden: {
        moeglich: null,
        beschreibung: null,
      },
      seillaengen: [],
    },
    anreise: {
      parkplatz: {
        ort: null,
        kosten: null,
        besonderheiten: null,
      },
      oev: {
        verkehrsmittel: [],
        endstation: null,
        luftseilbahn_moeglich: null,
        anmeldung_noetig: null,
      },
    },
    zustieg_und_abstieg: {
      zustieg: {
        einstiegsfindung: null,
        beschreibung: null,
        schwierigkeit: null,
      },
      abstieg: {
        fuehrt_zum_einstieg: null,
        verpflegung_moeglich: null,
        verpflegung_beschreibung: null,
        schwierigkeit: null,
      },
    },
    besonderes: {
      saisonalitaet: null,
      hinweise: [],
    },
  };
}

describe('climbing extraction', () => {
  test('runs extraction for ready climbing preprocessor output', async () => {
    const input = climbingOutput();
    const calls: unknown[] = [];

    const result = await extractPreparedClimbingReport(input, {
      title: 'Gross Turm - Sudgrat',
      extractClimbing: async (extractorInput) => {
        calls.push(extractorInput);
        return emptyExtractionOutput();
      },
    });

    expect(result).toBe(input);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      title: 'Gross Turm - Sudgrat',
      preprocessed: input,
    });
  });

  test('does not run extraction for non-ready preprocessor output', async () => {
    const input = climbingOutput({
      base: {
        ...climbingOutput().base,
        status: PREPROCESSOR_STATUS.SKIPPED,
        subActivity: null,
      },
      climbingTourBase: null,
      reasons: ['non_climbing_activity'],
    });
    let callCount = 0;

    const result = await extractPreparedClimbingReport(input, {
      title: 'Gross Turm - Sudgrat',
      extractClimbing: async () => {
        callCount += 1;
        return emptyExtractionOutput();
      },
    });

    expect(result).toBe(input);
    expect(callCount).toBe(0);
  });

  test('accepts partial structured extraction output', async () => {
    const partialOutput: ClimbingExtractionAgentResult = {
      schemaVersion: CLIMBING_EXTRACTION_SCHEMA_VERSION,
      zeitbedarf: {
        zustieg_min: 45,
      },
    };

    const extractClimbing = createMastraClimbingExtractor({
      generate: async () => ({ object: partialOutput }),
    });

    const result = await extractClimbing({
      title: 'Gross Turm - Sudgrat',
      preprocessed: climbingOutput(),
    });

    expect(result).toEqual(partialOutput);
  });
});
