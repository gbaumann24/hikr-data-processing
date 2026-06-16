import { describe, expect, test } from 'bun:test';
import {
  computeClimbingTourCompleteness,
  type ClimbingTourAggregationReportRecord,
  type ClimbingTourDetailsSchemaWriteInput,
} from '@hikr/db';
import {
  buildDeterministicAggregation,
  isRouteEligible,
  mergeAgentOutput,
} from '../src/climbing-aggregation';

describe('climbing tour aggregation', () => {
  test('computes completeness with conditional anders fields and array coverage', () => {
    const plain = computeClimbingTourCompleteness({
      reportId: 1n,
      schemaVersion: 'climbing-extraction-v1',
      ausruestung: {
        seil: {
          art: 'einfachseil',
          laenge_m: 50,
        },
        mobile_absicherung: {
          notwendigkeit: [],
        },
      },
    });
    const andersMissing = computeClimbingTourCompleteness({
      reportId: 1n,
      schemaVersion: 'climbing-extraction-v1',
      ausruestung: {
        seil: {
          art: 'anders',
          laenge_m: 50,
        },
        mobile_absicherung: {
          notwendigkeit: [],
        },
      },
    });
    const andersFilled = computeClimbingTourCompleteness({
      reportId: 1n,
      schemaVersion: 'climbing-extraction-v1',
      ausruestung: {
        seil: {
          art: 'anders',
          anders: 'Doppelseil',
          laenge_m: 50,
        },
        mobile_absicherung: {
          notwendigkeit: ['empfohlen'],
        },
      },
    });

    expect(andersMissing.possibleFields).toBe(plain.possibleFields + 1);
    expect(andersFilled.filledFields).toBe(andersMissing.filledFields + 2);
    expect(andersFilled.score).toBeGreaterThan(andersMissing.score);
  });

  test('aggregates deterministic scalar, multi-label, boolean, number, and pitch fields', () => {
    const reports = [
      report({
        reportId: 1n,
        qualityScore: 2,
        completenessScore: 0.9,
        details: {
          zusammenfassung: 'Schöne Plattenkletterei.',
          ausruestung: {
            seil: { art: 'einfachseil', laenge_m: 50 },
            mobile_absicherung: { notwendigkeit: ['empfohlen'] },
            expresskarabiner: { anzahl: 10 },
          },
          zeitbedarf: { zustieg_min: 45 },
          absicherung: { staende: { gebohrt: true } },
          schuhwerk: {
            zustieg: { typ: 'zustiegsschuhe' },
          },
          klettern: {
            seillaengen_info: {
              anzahl_total: 6,
              seillaengen: [
                {
                  nummer: 1,
                  schwierigkeit: '5a',
                  anzahl_bohrhaken: 4,
                  laenge_m: 35,
                  beschreibung: 'Geneigte Platte.',
                },
                {
                  nummer: 2,
                  schwierigkeit: '5b',
                },
              ],
            },
          },
        },
      }),
      report({
        reportId: 2n,
        qualityScore: 5,
        completenessScore: 0.7,
        details: {
          zusammenfassung: 'Sehr schöne Route.',
          ausruestung: {
            seil: { art: 'halbseil', laenge_m: 60 },
            mobile_absicherung: { notwendigkeit: ['empfohlen', 'verwendet'] },
            expresskarabiner: { anzahl: 12 },
          },
          zeitbedarf: { zustieg_min: 75 },
          absicherung: { staende: { gebohrt: false } },
          schuhwerk: {
            zustieg: { typ: 'bergschuhe' },
          },
          klettern: {
            seillaengen_info: {
              anzahl_total: 6,
              seillaengen: [
                {
                  nummer: 1,
                  schwierigkeit: '5a',
                  anzahl_bohrhaken: 5,
                  laenge_m: 40,
                  beschreibung: 'Platte mit kurzer Reibungsstelle.',
                },
                {
                  nummer: 2,
                  schwierigkeit: '5c',
                },
              ],
            },
          },
        },
      }),
    ];

    const { payload, agentInput } = buildDeterministicAggregation(7n, reports);
    const typed = payload as any;

    expect(typed.ausruestung.seil.art).toMatchObject({
      primary: 'halbseil',
      counts: { einfachseil: 1, halbseil: 1 },
      weighted_counts: { einfachseil: 2, halbseil: 5 },
      observed_count: 2,
    });
    expect(typed.ausruestung.mobile_absicherung.notwendigkeit).toEqual({
      primary: 'empfohlen',
      values: ['empfohlen', 'verwendet'],
      counts: { empfohlen: 2, verwendet: 1 },
      weighted_counts: { empfohlen: 7, verwendet: 5 },
      observed_count: 2,
    });
    expect(typed.ausruestung.seil.laenge_m).toEqual({
      min: 50,
      max: 60,
      mode: 50,
      counts: { '50': 1, '60': 1 },
      observed_count: 2,
    });
    expect(typed.zeitbedarf.zustieg_min).toEqual({
      min: 45,
      median: 60,
      max: 75,
      observed_count: 2,
    });
    expect(typed.absicherung.staende.gebohrt).toMatchObject({
      consensus: false,
      true_count: 1,
      false_count: 1,
      weighted_true: 2,
      weighted_false: 5,
    });
    expect(typed.klettern.seillaengen_info.seillaengen.by_nummer['1']).toMatchObject({
      schwierigkeit: {
        primary: '5a',
        counts: { '5a': 2 },
        weighted_counts: { '5a': 7 },
      },
      anzahl_bohrhaken: {
        counts: { '4': 1, '5': 1 },
      },
      laenge_m: {
        median: 37.5,
      },
    });
    expect(typed.klettern.seillaengen_info.seillaengen.by_nummer['2'].schwierigkeit).toMatchObject({
      primary: '5c',
      counts: { '5b': 1, '5c': 1 },
      weighted_counts: { '5b': 2, '5c': 5 },
    });
    expect(typed.schuhwerk.zustieg.typ).toMatchObject({
      primary: 'bergschuhe',
      counts: { zustiegsschuhe: 1, bergschuhe: 1 },
      weighted_counts: { zustiegsschuhe: 2, bergschuhe: 5 },
    });
    expect(typed.schuhwerk.zustieg.typ.ordinal).toBeUndefined();
    expect(typed.source_quality.completeness).toMatchObject({
      min: 0.7,
      median: 0.8,
      max: 0.9,
      observed_count: 2,
      source_report_count_above_80: 1,
    });
    expect(typed.berichtsqualitaet.score).toEqual({
      min: 2,
      median: 3.5,
      max: 5,
      observed_count: 2,
    });
    expect(agentInput.text.zusammenfassung).toHaveLength(2);
    expect(typed.zusammenfassung).toEqual({ observed_count: 2 });
  });

  test('applies refined deterministic aggregation rules', () => {
    const reports = [
      report({
        reportId: 1n,
        qualityScore: 4,
        details: {
          ausruestung: {
            mobile_absicherung: {
              notwendigkeit: ['nicht_notwendig'],
              friends: [{ groesse: '0,75' }],
              keile: [{ groesse: '0,5' }],
            },
          },
          klettern: {
            routenverlauf: { routenfindung: 'mittel' },
            seillaengen_info: {
              seillaengen: [{ nummer: 5, schwierigkeit: 'VI+' }],
            },
          },
        },
      }),
      report({
        reportId: 2n,
        qualityScore: 4,
        details: {
          ausruestung: {
            mobile_absicherung: {
              notwendigkeit: ['empfohlen'],
              friends: [{ groesse: '0.75' }],
              keile: [{ groesse: '0.5' }],
            },
          },
          klettern: {
            routenverlauf: { routenfindung: 'einfach' },
            seillaengen_info: {
              seillaengen: [{ nummer: 5, schwierigkeit: '6a' }],
            },
          },
        },
      }),
      report({
        reportId: 3n,
        qualityScore: 4,
        details: {
          ausruestung: {
            mobile_absicherung: {
              notwendigkeit: ['nicht_verwendet'],
            },
          },
          klettern: {
            routenverlauf: { routenfindung: 'schwierig' },
          },
        },
      }),
    ];

    const { payload } = buildDeterministicAggregation(7n, reports);
    const typed = payload as any;

    expect(typed.klettern.routenverlauf.routenfindung).toMatchObject({
      primary: 'mittel',
      counts: { mittel: 1, einfach: 1, schwierig: 1 },
      weighted_counts: { mittel: 4, einfach: 4, schwierig: 4 },
      ordinal: { min: 'einfach', median: 'mittel', max: 'schwierig' },
      observed_count: 3,
    });
    expect(typed.ausruestung.mobile_absicherung.notwendigkeit).toMatchObject({
      primary: 'empfohlen',
      counts: { nicht_notwendig: 1, empfohlen: 1, nicht_verwendet: 1 },
      weighted_counts: { nicht_notwendig: 4, empfohlen: 4, nicht_verwendet: 4 },
      observed_count: 3,
    });
    expect(typed.ausruestung.mobile_absicherung.friends.groesse).toEqual({
      values: ['0.75'],
      counts: { '0.75': 2 },
      observed_count: 2,
    });
    expect(typed.ausruestung.mobile_absicherung.keile.groesse).toEqual({
      values: ['0.5'],
      counts: { '0.5': 2 },
      observed_count: 2,
    });
    expect(typed.klettern.seillaengen_info.seillaengen.by_nummer['5'].schwierigkeit).toMatchObject({
      primary: '6a',
      counts: { '6a': 2 },
      weighted_counts: { '6a': 8 },
      observed_count: 2,
    });
    expect(Object.keys(payload)).toEqual([
      'schemaVersion',
      'route_id',
      'source_report_count',
      'source_report_ids',
      'input_schema_versions',
      'source_quality',
      'ausruestung',
      'klettern',
      'berichtsqualitaet',
    ]);
  });

  test('merges structured agent output into deterministic payload', () => {
    const payload: Record<string, unknown> = {};

    mergeAgentOutput(payload, {
      text: [
        {
          path: 'zusammenfassung',
          text: 'Die Route bietet kompakte Plattenkletterei.',
        },
      ],
      gefahren_by_typ: [
        {
          typ: 'steinschlag',
          beschreibung: 'Steinschlaggefahr besteht im oberen Wandteil.',
        },
      ],
      schluesselstellen: [
        {
          wo: '1. SL',
          beschreibung: 'Kurze Reibungsstelle.',
          evidence_count: 2,
        },
      ],
      seillaengen_by_nummer: [
        { nummer: '1', beschreibung: 'Die erste Seillänge führt über geneigte Platten.' },
      ],
      hinweise: ['Topo mitnehmen.'],
    });

    expect(payload).toMatchObject({
      zusammenfassung: {
        summary: 'Die Route bietet kompakte Plattenkletterei.',
      },
      gelaende_und_gefahren: {
        gefahren: {
          by_typ: {
            steinschlag: {
              beschreibung: {
                summary: 'Steinschlaggefahr besteht im oberen Wandteil.',
              },
            },
          },
        },
      },
      klettern: {
        schluesselstellen: {
          stellen: {
            values: [
              {
                wo: '1. SL',
                beschreibung: 'Kurze Reibungsstelle.',
                evidence_count: 2,
              },
            ],
          },
        },
        seillaengen_info: {
          seillaengen: {
            by_nummer: {
              '1': {
                beschreibung: {
                  summary: 'Die erste Seillänge führt über geneigte Platten.',
                },
              },
            },
          },
        },
      },
      besonderes: {
        hinweise: {
          values: ['Topo mitnehmen.'],
        },
      },
    });
  });

  test('qualifies single-report routes only above completeness threshold', () => {
    expect(isRouteEligible([report({ completenessScore: 0.81 })])).toBe(true);
    expect(isRouteEligible([report({ completenessScore: 0.8 })])).toBe(false);
    expect(isRouteEligible([report({ completenessScore: 0.2 }), report({ reportId: 2n })])).toBe(
      true,
    );
  });
});

function report(
  input: {
    routeId?: bigint;
    reportId?: bigint;
    qualityScore?: number | null;
    completenessScore?: number | null;
    details?: Partial<ClimbingTourDetailsSchemaWriteInput>;
  } = {},
): ClimbingTourAggregationReportRecord {
  const reportId = input.reportId ?? 1n;
  return {
    routeId: input.routeId ?? 7n,
    reportId,
    tourDate: null,
    qualityScore: input.qualityScore ?? 3,
    completeness: {
      score: input.completenessScore ?? 0.9,
      filledFields: null,
      possibleFields: null,
    },
    details: {
      reportId,
      schemaVersion: 'climbing-extraction-v1',
      ...input.details,
    },
  };
}
