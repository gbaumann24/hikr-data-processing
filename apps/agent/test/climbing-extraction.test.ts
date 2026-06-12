import { describe, expect, test } from 'bun:test';
import { ACTIVITY, PREPROCESSOR_STATUS } from '../src/mastra/workflows/baselayer';
import {
  CLIMBING_EXTRACTION_SCHEMA_VERSION,
  CLIMBING_PREPROCESSOR_SCHEMA_VERSION,
  CLIMBING_SUB_ACTIVITY,
  climbingExtractionAgentResultSchema,
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
    const extractionOutput = emptyExtractionOutput();
    const calls: unknown[] = [];

    const result = await extractPreparedClimbingReport(input, {
      title: 'Gross Turm - Sudgrat',
      extractClimbing: async (extractorInput) => {
        calls.push(extractorInput);
        return extractionOutput;
      },
    });

    expect(result).toEqual({ ...input, extraction: extractionOutput });
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

    expect(result).toEqual({ ...input, extraction: null });
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

  test('accepts gear items with independently missing size or count', () => {
    const output: ClimbingExtractionAgentResult = {
      schemaVersion: CLIMBING_EXTRACTION_SCHEMA_VERSION,
      ausruestung: {
        mobile_absicherung: {
          friends: [{ groesse: '0.75' }, { anzahl: 3 }],
          keile: [{ groesse: 'satz' }, { anzahl: 5 }],
        },
        schlingen: [{ laenge_cm: 120 }, { typ: 'reepschnur' }, { anzahl: 2 }],
      },
    };

    expect(climbingExtractionAgentResultSchema.safeParse(output).success).toBe(true);
  });

  test('accepts the prompt-design extraction field set', () => {
    const output: ClimbingExtractionAgentResult = {
      schemaVersion: CLIMBING_EXTRACTION_SCHEMA_VERSION,
      ausruestung: {
        seil: { art: 'halbseil', laenge_m: 60 },
        mobile_absicherung: {
          erforderlich: true,
          empfohlen: false,
          verwendet: true,
          moeglichkeiten: 'gute Rissstrukturen fuer Friends',
          friends: [{ groesse: '0.3-2', anzahl: null }],
          keile: [{ groesse: 'satz', anzahl: null }],
        },
        schlingen: [{ typ: 'bandschlinge', laenge_cm: 120, anzahl: 2 }],
        expresskarabiner: { anzahl: 10 },
        zusaetzlich: ['helm'],
      },
      zeitbedarf: {
        zustieg_min: 45,
        reine_kletterzeit_min: 180,
        abstieg_min: 60,
      },
      absicherung: {
        hakenabstaende: { bewertung: 'mittel', beschreibung: 'teils weite Abstaende' },
        staende: { gebohrt: true, beschreibung: 'Bohrhakenstaende mit Ringen' },
        hakenzustand: { bewertung: 'gut', beschreibung: 'solide Klebehaken' },
      },
      schuhwerk: {
        zustieg: { typ: 'zustiegsschuhe' },
        klettern: { typ: 'kletterschuhe' },
        abstieg: { typ: 'bergschuhe' },
      },
      gelaende_und_gefahren: {
        charakter: {
          exposition: 'SO',
          sonnig: true,
          schnell_trocknend: false,
          felsart: 'kalk',
        },
        gefahren: [{ typ: 'steinschlag', beschreibung: 'durch andere Seilschaften' }],
      },
      klettern: {
        schluesselstellen: {
          vorhanden: true,
          stellen: [{ wo: '3. Seillaenge', beschreibung: 'technische Platte' }],
        },
        schwierigkeit: {
          verhaeltnis: 'schwerer',
          beschreibung: 'hart fuer 5c',
        },
        abseilen: {
          moeglich: true,
          anzahl: 4,
          laengen_m: [25, 50],
          zum_einstieg: true,
          abseilpiste: false,
        },
        charakter: {
          kletterstil: ['platte', 'riss'],
        },
        routenverlauf: {
          routenfindung: 'mittel',
          beschreibung: 'etwas Spuersinn noetig',
          rueckzug_moeglich: true,
          rueckzug_beschreibung: 'bis zur 4. SL abseilbar',
        },
        seillaengen_verbinden: {
          moeglich: true,
          beschreibung: 'SL 3 und 4 mit 60m-Seil zusammenhaengbar',
        },
        seillaengen: [
          {
            nummer: 1,
            schwierigkeit: '5c',
            anzahl_bohrhaken: 6,
            laenge_m: 35,
            beschreibung: 'Plattenkletterei',
          },
        ],
      },
      anreise: {
        parkplatz: {
          ort: 'Parkplatz Saentisbahn',
          kosten: '5 CHF/Tag',
          besonderheiten: 'wenige Plaetze',
        },
        oev: {
          verkehrsmittel: ['zug', 'bus'],
          endstation: 'Wasserauen',
          luftseilbahn_moeglich: true,
          anmeldung_noetig: false,
        },
      },
      zustieg_und_abstieg: {
        zustieg: {
          einstiegsfindung: 'einfach',
          beschreibung: 'Route name on rock',
          schwierigkeit: 'T3',
        },
        abstieg: {
          fuehrt_zum_einstieg: true,
          verpflegung_moeglich: true,
          verpflegung_beschreibung: 'Berggasthaus Aescher',
          schwierigkeit: 'scree and old snowfields',
        },
      },
      besonderes: {
        saisonalitaet: 'ideal im Herbst',
        hinweise: ['Topo mitnehmen'],
      },
    };

    expect(climbingExtractionAgentResultSchema.safeParse(output).success).toBe(true);
  });

  test('rejects invalid exposition values', () => {
    const output = {
      schemaVersion: CLIMBING_EXTRACTION_SCHEMA_VERSION,
      gelaende_und_gefahren: {
        charakter: {
          exposition: 'NNO',
        },
      },
    };

    expect(climbingExtractionAgentResultSchema.safeParse(output).success).toBe(false);
  });

  test('rejects invalid structured extraction output', async () => {
    const extractClimbing = createMastraClimbingExtractor({
      generate: async () => ({
        object: {
          schemaVersion: CLIMBING_EXTRACTION_SCHEMA_VERSION,
          zeitbedarf: {
            zustieg_min: '45',
          },
        },
      }),
    });

    await expect(
      extractClimbing({
        title: 'Gross Turm - Sudgrat',
        preprocessed: climbingOutput(),
      }),
    ).rejects.toThrow('Mastra climbing extraction agent returned invalid structured output');
  });
});
