import type { ClimbingTourAggregationAgentOutput } from 'agent/mastra/agents/climbing-tour-aggregation-agent';
import { normalizeClimbingDifficultyValue } from 'agent/mastra/workflows/baselayer/utils/difficulty';
import {
  CLIMBING_TOUR_AGGREGATION_SCHEMA_VERSION,
  type ClimbingTourAggregationReport,
  type DeterministicAggregationResult,
  type TextEvidenceItem,
} from './types';

type Counts = Record<string, number>;
type WeightedCounts = Record<string, number>;
type Normalizer = (value: string) => string;

const TEXT_PATHS = [
  'zusammenfassung',
  'ausruestung.mobile_absicherung.begruendung',
  'ausruestung.mobile_absicherung.moeglichkeiten',
  'absicherung.hakenabstaende.beschreibung',
  'absicherung.staende.beschreibung',
  'absicherung.hakenzustand.beschreibung',
  'gelaende_und_gefahren.charakter.beschreibung',
  'klettern.schwierigkeit.beschreibung',
  'klettern.schwierigkeit.min_klettererfahrung',
  'klettern.abseilen.beschreibung',
  'klettern.charakter.beschreibung',
  'klettern.routenverlauf.beschreibung',
  'klettern.routenverlauf.rueckzug_beschreibung',
  'klettern.seillaengen_info.verbinden.beschreibung',
  'anreise.parkplatz.kosten',
  'anreise.parkplatz.besonderheiten',
  'zustieg_und_abstieg.zustieg.beschreibung',
  'zustieg_und_abstieg.zustieg.schwierigkeit',
  'zustieg_und_abstieg.abstieg.schwierigkeit',
  'berichtsqualitaet.begruendung',
  'besonderes.bedingungen.beschreibung',
] as const;

const SCALAR_ENUM_PATHS = [
  'ausruestung.seil.art',
  'gelaende_und_gefahren.charakter.exposition',
  'gelaende_und_gefahren.charakter.felsart',
  'schuhwerk.zustieg.typ',
  'schuhwerk.klettern.typ',
  'schuhwerk.abstieg.typ',
  'klettern.schwierigkeit.verhaeltnis',
  'zustieg_und_abstieg.verpflegung_typ',
] as const;

const STRING_DISTRIBUTION_PATHS = [
  'anreise.ausgangspunkt.name',
  'anreise.parkplatz.ort',
  'anreise.talstation.name',
  'anreise.oev.endstation',
  'anreise.von_passhoehe_aus',
] as const;

const MULTI_ENUM_PATHS = [
  'absicherung.hakentypen',
  'gelaende_und_gefahren.felsqualitaet',
  'klettern.charakter.kletterstil',
  'besonderes.saisonalitaet.geeignet',
] as const;

const BOOLEAN_PATHS = [
  'absicherung.staende.gebohrt',
  'gelaende_und_gefahren.charakter.sonnig',
  'gelaende_und_gefahren.charakter.schnell_trocknend',
  'klettern.abseilen.moeglich',
  'klettern.abseilen.zum_einstieg',
  'klettern.abseilen.abseilpiste',
  'klettern.routenverlauf.rueckzug_moeglich',
  'klettern.seillaengen_info.verbinden.moeglich',
  'anreise.oev.luftseilbahn_moeglich',
  'anreise.oev.anmeldung_noetig',
  'zustieg_und_abstieg.abstieg.fuehrt_zum_einstieg',
  'stuetzpunkt.mehrtags',
  'besonderes.bedingungen.altschnee_auf_zustieg',
] as const;

const CONTINUOUS_NUMBER_PATHS = [
  'zeitbedarf.zustieg_min',
  'zeitbedarf.reine_kletterzeit_min',
  'zeitbedarf.abstieg_min',
  'klettern.abseilen.abseil_max_laenge_m',
  'klettern.charakter.wandhoehe_m',
  'klettern.routenverlauf.einstiegshoehe_m',
  'anreise.ausgangspunkt.hoehe_m',
  'anreise.parkplatz.hoehe_m',
  'anreise.talstation.hoehe_m',
  'zustieg_und_abstieg.zustieg.hm_aufstieg',
  'zustieg_und_abstieg.zustieg.hm_abstieg',
  'zustieg_und_abstieg.abstieg.hm_aufstieg',
  'zustieg_und_abstieg.abstieg.hm_abstieg',
] as const;

const DISCRETE_NUMBER_PATHS = [
  'ausruestung.seil.laenge_m',
  'ausruestung.expresskarabiner.anzahl',
  'klettern.seillaengen_info.anzahl_total',
] as const;

const ANDERS_ARRAY_PATHS = [
  'absicherung.hakentypen_anders',
  'gelaende_und_gefahren.felsqualitaet_anders',
  'klettern.charakter.anders',
] as const;

const ORDINAL_PATHS: Array<{ path: string; order: string[] }> = [
  { path: 'absicherung.charakter', order: ['plaisir', 'sportlich', 'alpin', 'trad'] },
  {
    path: 'absicherung.hakenabstaende.bewertung',
    order: ['sehr_gut', 'gut', 'mittel', 'schlecht'],
  },
  { path: 'absicherung.hakenzustand.bewertung', order: ['gut', 'mittel', 'schlecht'] },
  {
    path: 'klettern.charakter.schoenheit',
    order: ['uninteressant', 'nett', 'schoen', 'sehr_schoen', 'traumhaft'],
  },
  { path: 'klettern.charakter.ernsthaftigkeit', order: ['ungefaehrlich', 'ernst', 'sehr_ernst'] },
  { path: 'klettern.routenverlauf.routenfindung', order: ['einfach', 'mittel', 'schwierig'] },
  { path: 'zustieg_und_abstieg.zustieg.einstiegsfindung', order: ['einfach', 'mittel', 'schwer'] },
  {
    path: 'besonderes.frequentierung',
    order: ['einsam', 'wenig_begangen', 'normal', 'beliebt', 'sehr_beliebt'],
  },
];

const MOBILE_PROTECTION_NECESSITY_ORDER = [
  'erforderlich',
  'empfohlen',
  'verwendet',
  'nicht_notwendig',
  'nicht_empfohlen',
  'nicht_verwendet',
];

const TOP_LEVEL_KEY_ORDER = [
  'schemaVersion',
  'route_id',
  'source_report_count',
  'source_report_ids',
  'input_schema_versions',
  'source_quality',
  'zusammenfassung',
  'ausruestung',
  'zeitbedarf',
  'absicherung',
  'schuhwerk',
  'gelaende_und_gefahren',
  'klettern',
  'anreise',
  'zustieg_und_abstieg',
  'stuetzpunkt',
  'quellen',
  'berichtsqualitaet',
  'besonderes',
];

const GENERIC_AGGREGATE_KEY_ORDER = [
  'primary',
  'consensus',
  'values',
  'counts',
  'weighted_counts',
  'true_count',
  'false_count',
  'weighted_true',
  'weighted_false',
  'min',
  'median',
  'max',
  'mode',
  'ordinal',
  'summary',
  'by_typ',
  'by_nummer',
  'groesse',
  'anzahl',
  'laenge_cm',
  'typ',
  'anders',
  'schwierigkeit',
  'anzahl_bohrhaken',
  'laenge_m',
  'beschreibung',
  'observed_count',
];

const KEY_ORDER_BY_PATH: Record<string, string[]> = {
  '': TOP_LEVEL_KEY_ORDER,
  source_quality: ['completeness', 'report_quality_score'],
  ausruestung: ['seil', 'mobile_absicherung', 'schlingen', 'expresskarabiner', 'zusaetzlich'],
  'ausruestung.seil': ['art', 'anders', 'laenge_m'],
  'ausruestung.mobile_absicherung': [
    'notwendigkeit',
    'begruendung',
    'moeglichkeiten',
    'friends',
    'keile',
  ],
  zeitbedarf: ['zustieg_min', 'reine_kletterzeit_min', 'abstieg_min'],
  absicherung: [
    'charakter',
    'hakentypen',
    'hakentypen_anders',
    'hakenabstaende',
    'staende',
    'hakenzustand',
  ],
  'absicherung.hakenabstaende': ['bewertung', 'beschreibung'],
  'absicherung.staende': ['gebohrt', 'beschreibung'],
  'absicherung.hakenzustand': ['bewertung', 'beschreibung'],
  schuhwerk: ['zustieg', 'klettern', 'abstieg'],
  'schuhwerk.zustieg': ['typ', 'anders'],
  'schuhwerk.klettern': ['typ', 'anders'],
  'schuhwerk.abstieg': ['typ', 'anders'],
  gelaende_und_gefahren: ['charakter', 'gefahren', 'felsqualitaet', 'felsqualitaet_anders'],
  'gelaende_und_gefahren.charakter': [
    'exposition',
    'sonnig',
    'schnell_trocknend',
    'felsart',
    'anders',
    'beschreibung',
  ],
  'gelaende_und_gefahren.gefahren': ['typ', 'anders', 'by_typ', 'observed_count'],
  klettern: [
    'schluesselstellen',
    'schwierigkeit',
    'abseilen',
    'charakter',
    'routenverlauf',
    'seillaengen_info',
  ],
  'klettern.schluesselstellen': ['stellen'],
  'klettern.schwierigkeit': ['verhaeltnis', 'beschreibung', 'min_klettererfahrung'],
  'klettern.abseilen': [
    'moeglich',
    'abseil_max_laenge_m',
    'zum_einstieg',
    'abseilpiste',
    'beschreibung',
  ],
  'klettern.charakter': [
    'kletterstil',
    'anders',
    'beschreibung',
    'schoenheit',
    'ernsthaftigkeit',
    'wandhoehe_m',
  ],
  'klettern.routenverlauf': [
    'routenfindung',
    'beschreibung',
    'rueckzug_moeglich',
    'rueckzug_beschreibung',
    'einstiegshoehe_m',
  ],
  'klettern.seillaengen_info': ['anzahl_total', 'verbinden', 'seillaengen'],
  'klettern.seillaengen_info.verbinden': ['moeglich', 'beschreibung'],
  'klettern.seillaengen_info.seillaengen': ['by_nummer', 'observed_count'],
  anreise: ['ausgangspunkt', 'parkplatz', 'talstation', 'oev', 'von_passhoehe_aus'],
  'anreise.ausgangspunkt': ['name', 'hoehe_m'],
  'anreise.parkplatz': ['ort', 'hoehe_m', 'kosten', 'besonderheiten'],
  'anreise.talstation': ['name', 'hoehe_m'],
  'anreise.oev': ['verkehrsmittel', 'endstation', 'luftseilbahn_moeglich', 'anmeldung_noetig'],
  zustieg_und_abstieg: ['zustieg', 'abstieg', 'verpflegung_typ'],
  'zustieg_und_abstieg.zustieg': [
    'einstiegsfindung',
    'beschreibung',
    'schwierigkeit',
    'hm_aufstieg',
    'hm_abstieg',
  ],
  'zustieg_und_abstieg.abstieg': [
    'fuehrt_zum_einstieg',
    'schwierigkeit',
    'hm_aufstieg',
    'hm_abstieg',
  ],
  stuetzpunkt: ['typ', 'mehrtags'],
  quellen: ['kletterfuehrer', 'topo_url'],
  berichtsqualitaet: ['score', 'begruendung'],
  besonderes: ['saisonalitaet', 'frequentierung', 'bedingungen', 'hinweise'],
  'besonderes.saisonalitaet': ['geeignet'],
  'besonderes.bedingungen': ['fels_zustand', 'altschnee_auf_zustieg', 'beschreibung'],
};

export function buildDeterministicAggregation(
  routeId: bigint,
  reports: ClimbingTourAggregationReport[],
): DeterministicAggregationResult {
  const payload: Record<string, unknown> = {
    schemaVersion: CLIMBING_TOUR_AGGREGATION_SCHEMA_VERSION,
    route_id: routeId.toString(),
    source_report_count: reports.length,
    source_report_ids: reports.map((report) => report.reportId.toString()),
    input_schema_versions: simpleCounts(reports.map((report) => report.details.schemaVersion)),
  };

  setIfPresent(
    payload,
    'source_quality.completeness',
    aggregateContinuousValues(reports.map((report) => report.completeness.score)),
  );
  const reportQualityAggregate = aggregateContinuousValues(
    reports.map((report) => report.qualityScore),
  );
  setIfPresent(payload, 'source_quality.report_quality_score', reportQualityAggregate);
  setIfPresent(payload, 'berichtsqualitaet.score', reportQualityAggregate);
  setPath(
    payload,
    'source_quality.completeness.source_report_count_above_80',
    reports.filter((report) => (report.completeness.score ?? 0) > 0.8).length,
  );

  for (const path of SCALAR_ENUM_PATHS) {
    setIfPresent(payload, path, aggregateScalarDistribution(reports, path, normalizeLiteral));
  }

  for (const path of STRING_DISTRIBUTION_PATHS) {
    setIfPresent(
      payload,
      path,
      aggregateScalarDistribution(reports, path, normalizePreservingCase),
    );
  }

  for (const path of MULTI_ENUM_PATHS) {
    setIfPresent(payload, path, aggregateMultiDistribution(reports, path, normalizeLiteral));
  }

  setIfPresent(
    payload,
    'ausruestung.mobile_absicherung.notwendigkeit',
    aggregateMobileProtectionNecessity(reports),
  );

  for (const path of BOOLEAN_PATHS) {
    setIfPresent(payload, path, aggregateBoolean(reports, path));
  }

  for (const path of CONTINUOUS_NUMBER_PATHS) {
    setIfPresent(payload, path, aggregateContinuous(reports, path));
  }

  for (const path of DISCRETE_NUMBER_PATHS) {
    setIfPresent(payload, path, aggregateDiscrete(reports, path));
  }

  for (const path of ANDERS_ARRAY_PATHS) {
    setIfPresent(payload, path, aggregateMultiDistribution(reports, path, normalizeFreeValue));
  }

  for (const { path, order } of ORDINAL_PATHS) {
    setIfPresent(payload, path, aggregateOrdinal(reports, path, order));
  }

  setIfPresent(
    payload,
    'ausruestung.seil.anders',
    aggregateScalarAsCounts(reports, 'ausruestung.seil.anders'),
  );
  setIfPresent(
    payload,
    'schuhwerk.zustieg.anders',
    aggregateScalarAsCounts(reports, 'schuhwerk.zustieg.anders'),
  );
  setIfPresent(
    payload,
    'schuhwerk.klettern.anders',
    aggregateScalarAsCounts(reports, 'schuhwerk.klettern.anders'),
  );
  setIfPresent(
    payload,
    'schuhwerk.abstieg.anders',
    aggregateScalarAsCounts(reports, 'schuhwerk.abstieg.anders'),
  );
  setIfPresent(
    payload,
    'gelaende_und_gefahren.charakter.anders',
    aggregateScalarAsCounts(reports, 'gelaende_und_gefahren.charakter.anders'),
  );

  setIfPresent(
    payload,
    'ausruestung.mobile_absicherung.friends',
    aggregateSizedItems(reports, 'ausruestung.mobile_absicherung.friends'),
  );
  setIfPresent(
    payload,
    'ausruestung.mobile_absicherung.keile',
    aggregateSizedItems(reports, 'ausruestung.mobile_absicherung.keile'),
  );
  setIfPresent(payload, 'ausruestung.schlingen', aggregateSlings(reports));
  setIfPresent(
    payload,
    'ausruestung.zusaetzlich',
    aggregateNamedItems(reports, 'ausruestung.zusaetzlich'),
  );
  setIfPresent(
    payload,
    'anreise.oev.verkehrsmittel',
    aggregateNamedItems(reports, 'anreise.oev.verkehrsmittel'),
  );
  setIfPresent(payload, 'gelaende_und_gefahren.gefahren', aggregateHazards(reports));
  setIfPresent(payload, 'klettern.seillaengen_info.seillaengen', aggregatePitches(reports));
  setIfPresent(payload, 'klettern.schluesselstellen.stellen', aggregateCruxPresence(reports));
  setIfPresent(
    payload,
    'stuetzpunkt.typ',
    aggregateScalarAsMultiDistribution(reports, 'stuetzpunkt.typ'),
  );
  setIfPresent(
    payload,
    'quellen.kletterfuehrer',
    aggregateStringArrayCounts(reports, 'quellen.kletterfuehrer'),
  );
  setIfPresent(
    payload,
    'quellen.topo_url',
    aggregateStringArrayCounts(reports, 'quellen.topo_url'),
  );
  setIfPresent(
    payload,
    'besonderes.bedingungen.fels_zustand',
    aggregateScalarAsCounts(reports, 'besonderes.bedingungen.fels_zustand'),
  );

  const agentInput = buildAgentInput(routeId, reports, payload);
  addTextEvidenceCounts(payload, agentInput);
  const orderedPayload = orderAggregationPayload(payload);
  return {
    payload: orderedPayload,
    agentInput: {
      ...agentInput,
      deterministicPayload: orderedPayload,
    },
  };
}

export function orderAggregationPayload(payload: Record<string, unknown>): Record<string, unknown> {
  return orderObject(payload) as Record<string, unknown>;
}

export function mergeAgentOutput(
  payload: Record<string, unknown>,
  output: ClimbingTourAggregationAgentOutput,
): void {
  for (const entry of output.text ?? []) {
    if (isNonEmptyString(entry.path) && isNonEmptyString(entry.text)) {
      mergeAggregateObject(payload, entry.path.trim(), { summary: entry.text.trim() });
    }
  }

  for (const entry of output.gefahren_by_typ ?? []) {
    if (isNonEmptyString(entry.typ) && isNonEmptyString(entry.beschreibung)) {
      mergeAggregateObject(
        payload,
        `gelaende_und_gefahren.gefahren.by_typ.${entry.typ.trim()}.beschreibung`,
        {
          summary: entry.beschreibung.trim(),
        },
      );
    }
  }

  if (output.schluesselstellen && output.schluesselstellen.length > 0) {
    setPath(payload, 'klettern.schluesselstellen.stellen.values', output.schluesselstellen);
  }

  for (const pitch of output.seillaengen_by_nummer ?? []) {
    if (isNonEmptyString(pitch.nummer) && isNonEmptyString(pitch.beschreibung)) {
      mergeAggregateObject(
        payload,
        `klettern.seillaengen_info.seillaengen.by_nummer.${pitch.nummer.trim()}.beschreibung`,
        {
          summary: pitch.beschreibung.trim(),
        },
      );
    }
  }

  if (output.hinweise && output.hinweise.length > 0) {
    mergeAggregateObject(payload, 'besonderes.hinweise', {
      values: output.hinweise.map((value) => value.trim()).filter(Boolean),
    });
  }
}

function addTextEvidenceCounts(
  payload: Record<string, unknown>,
  agentInput: DeterministicAggregationResult['agentInput'],
): void {
  for (const [path, evidenceItems] of Object.entries(agentInput.text)) {
    mergeAggregateObject(payload, path, { observed_count: evidenceItems.length });
  }

  for (const [typ, evidenceItems] of Object.entries(agentInput.gefahrenByTyp)) {
    mergeAggregateObject(payload, `gelaende_und_gefahren.gefahren.by_typ.${typ}.beschreibung`, {
      observed_count: evidenceItems.length,
    });
  }

  for (const [nummer, evidenceItems] of Object.entries(agentInput.seillaengenByNummer)) {
    mergeAggregateObject(
      payload,
      `klettern.seillaengen_info.seillaengen.by_nummer.${nummer}.beschreibung`,
      {
        observed_count: evidenceItems.length,
      },
    );
  }

  if (agentInput.hinweise.length > 0) {
    mergeAggregateObject(payload, 'besonderes.hinweise', {
      observed_count: agentInput.hinweise.length,
    });
  }
}

function buildAgentInput(
  routeId: bigint,
  reports: ClimbingTourAggregationReport[],
  deterministicPayload: Record<string, unknown>,
): DeterministicAggregationResult['agentInput'] {
  const text: Record<string, TextEvidenceItem[]> = {};
  const gefahrenByTyp: DeterministicAggregationResult['agentInput']['gefahrenByTyp'] = {};
  const schluesselstellen: DeterministicAggregationResult['agentInput']['schluesselstellen'] = [];
  const seillaengenByNummer: DeterministicAggregationResult['agentInput']['seillaengenByNummer'] =
    {};
  const hinweise: TextEvidenceItem[] = [];

  for (const report of reports) {
    for (const path of TEXT_PATHS) {
      const value = getString(report, path);
      if (!value) {
        continue;
      }

      text[path] ??= [];
      text[path].push(evidence(report, value));
    }

    for (const hazard of getArray<Record<string, unknown>>(
      report,
      'gelaende_und_gefahren.gefahren',
    )) {
      const typ = normalizeLiteral(typeof hazard.typ === 'string' ? hazard.typ : '');
      const beschreibung = normalizePreservingCase(
        typeof hazard.beschreibung === 'string' ? hazard.beschreibung : '',
      );
      if (!typ || !beschreibung) {
        continue;
      }

      gefahrenByTyp[typ] ??= [];
      gefahrenByTyp[typ].push({ ...evidence(report, beschreibung), typ });
    }

    for (const crux of getArray<Record<string, unknown>>(
      report,
      'klettern.schluesselstellen.stellen',
    )) {
      const beschreibung = normalizePreservingCase(
        typeof crux.beschreibung === 'string' ? crux.beschreibung : '',
      );
      if (!beschreibung) {
        continue;
      }

      schluesselstellen.push({
        reportId: report.reportId.toString(),
        tourDate: formatDate(report.tourDate),
        qualityScore: report.qualityScore,
        wo: typeof crux.wo === 'string' && crux.wo.trim() ? crux.wo.trim() : null,
        beschreibung,
      });
    }

    for (const pitch of getArray<Record<string, unknown>>(
      report,
      'klettern.seillaengen_info.seillaengen',
    )) {
      if (typeof pitch.nummer !== 'number' || !Number.isInteger(pitch.nummer)) {
        continue;
      }

      const beschreibung = normalizePreservingCase(
        typeof pitch.beschreibung === 'string' ? pitch.beschreibung : '',
      );
      if (!beschreibung) {
        continue;
      }

      const key = pitch.nummer.toString();
      seillaengenByNummer[key] ??= [];
      seillaengenByNummer[key].push({
        reportId: report.reportId.toString(),
        tourDate: formatDate(report.tourDate),
        qualityScore: report.qualityScore,
        nummer: pitch.nummer,
        beschreibung,
      });
    }

    for (const hinweis of getArray<string>(report, 'besonderes.hinweise')) {
      const textValue = normalizePreservingCase(hinweis);
      if (textValue) {
        hinweise.push(evidence(report, textValue));
      }
    }
  }

  return {
    routeId: routeId.toString(),
    sourceReportCount: reports.length,
    deterministicPayload,
    text,
    gefahrenByTyp,
    schluesselstellen,
    seillaengenByNummer,
    hinweise,
  };
}

function aggregateScalarDistribution(
  reports: ClimbingTourAggregationReport[],
  path: string,
  normalize: Normalizer,
): Record<string, unknown> | null {
  const entries = collectScalarValues(reports, path, normalize);
  if (entries.length === 0) {
    return null;
  }

  const counts = countEntries(entries.map((entry) => entry.value));
  const weightedCounts = countWeightedEntries(entries);

  return {
    primary: choosePrimary(counts, weightedCounts),
    values: Object.keys(counts),
    counts,
    weighted_counts: weightedCounts,
    observed_count: entries.length,
  };
}

function aggregateScalarAsCounts(
  reports: ClimbingTourAggregationReport[],
  path: string,
): Record<string, unknown> | null {
  const entries = collectScalarValues(reports, path, normalizeFreeValue);
  if (entries.length === 0) {
    return null;
  }

  const counts = countEntries(entries.map((entry) => entry.value));
  return { values: Object.keys(counts), counts, observed_count: entries.length };
}

function aggregateScalarAsMultiDistribution(
  reports: ClimbingTourAggregationReport[],
  path: string,
): Record<string, unknown> | null {
  const entries = collectScalarValues(reports, path, normalizeLiteral);
  if (entries.length === 0) {
    return null;
  }

  const counts = countEntries(entries.map((entry) => entry.value));
  const weightedCounts = countWeightedEntries(entries);
  return {
    values: Object.keys(counts),
    counts,
    weighted_counts: weightedCounts,
    observed_count: entries.length,
  };
}

function aggregateMultiDistribution(
  reports: ClimbingTourAggregationReport[],
  path: string,
  normalize: Normalizer,
  options: { weighted?: boolean; primary?: boolean } = {},
): Record<string, unknown> | null {
  const values: Array<{ value: string; weight: number }> = [];
  let observedCount = 0;

  for (const report of reports) {
    const reportValues = new Set(
      getArray<unknown>(report, path)
        .map((value) => (typeof value === 'string' ? normalize(value) : ''))
        .filter(Boolean),
    );

    if (reportValues.size === 0) {
      continue;
    }

    observedCount += 1;
    for (const value of reportValues) {
      values.push({ value, weight: getWeight(report) });
    }
  }

  if (values.length === 0) {
    return null;
  }

  const counts = countEntries(values.map((entry) => entry.value));
  const result: Record<string, unknown> = {
    values: Object.keys(counts),
    counts,
    observed_count: observedCount,
  };

  if (options.weighted !== false) {
    const weightedCounts = countWeightedEntries(values);
    result.weighted_counts = weightedCounts;
    if (options.primary === true) {
      result.primary = choosePrimary(counts, weightedCounts);
    }
  }

  return result;
}

function aggregateMobileProtectionNecessity(
  reports: ClimbingTourAggregationReport[],
): Record<string, unknown> | null {
  const entries: Array<{ value: string; weight: number }> = [];
  let observedCount = 0;

  for (const report of reports) {
    const reportValues = new Set(
      getArray<unknown>(report, 'ausruestung.mobile_absicherung.notwendigkeit')
        .map((value) => (typeof value === 'string' ? normalizeLiteral(value) : ''))
        .filter(Boolean),
    );

    if (reportValues.size === 0) {
      continue;
    }

    observedCount += 1;
    for (const value of reportValues) {
      entries.push({ value, weight: getWeight(report) });
    }
  }

  if (entries.length === 0) {
    return null;
  }

  const counts = countEntries(entries.map((entry) => entry.value));
  const weightedCounts = countWeightedEntries(entries);

  return {
    primary: chooseConservativePrimary(counts, MOBILE_PROTECTION_NECESSITY_ORDER),
    values: Object.keys(counts),
    counts,
    weighted_counts: weightedCounts,
    observed_count: observedCount,
  };
}

function aggregateBoolean(
  reports: ClimbingTourAggregationReport[],
  path: string,
): Record<string, unknown> | null {
  let trueCount = 0;
  let falseCount = 0;
  let weightedTrue = 0;
  let weightedFalse = 0;

  for (const report of reports) {
    const value = getPath(report.details, path);
    if (value !== true && value !== false) {
      continue;
    }

    if (value) {
      trueCount += 1;
      weightedTrue += getWeight(report);
    } else {
      falseCount += 1;
      weightedFalse += getWeight(report);
    }
  }

  const observedCount = trueCount + falseCount;
  if (observedCount === 0) {
    return null;
  }

  return {
    consensus: weightedTrue === weightedFalse ? null : weightedTrue > weightedFalse,
    true_count: trueCount,
    false_count: falseCount,
    weighted_true: weightedTrue,
    weighted_false: weightedFalse,
    observed_count: observedCount,
  };
}

function aggregateContinuous(
  reports: ClimbingTourAggregationReport[],
  path: string,
): Record<string, unknown> | null {
  return aggregateContinuousValues(reports.map((report) => getPath(report.details, path)));
}

function aggregateContinuousValues(values: unknown[]): Record<string, unknown> | null {
  const numbers = values.filter(isFiniteNumber).sort((left, right) => left - right);
  if (numbers.length === 0) {
    return null;
  }

  return {
    min: numbers[0],
    median: median(numbers),
    max: numbers[numbers.length - 1],
    observed_count: numbers.length,
  };
}

function aggregateDiscrete(
  reports: ClimbingTourAggregationReport[],
  path: string,
): Record<string, unknown> | null {
  return aggregateDiscreteValues(reports.map((report) => getPath(report.details, path)));
}

function aggregateDiscreteValues(values: unknown[]): Record<string, unknown> | null {
  const numbers = values.filter(isFiniteNumber);
  if (numbers.length === 0) {
    return null;
  }

  const counts = countEntries(numbers.map((value) => value.toString()));
  const modeKey = chooseMode(counts);

  return {
    min: Math.min(...numbers),
    max: Math.max(...numbers),
    mode: modeKey === null ? null : Number(modeKey),
    counts,
    observed_count: numbers.length,
  };
}

function aggregateOrdinal(
  reports: ClimbingTourAggregationReport[],
  path: string,
  order: string[],
): Record<string, unknown> | null {
  const entries = collectScalarValues(reports, path, normalizeLiteral);
  if (entries.length === 0) {
    return null;
  }

  const counts = countEntries(entries.map((entry) => entry.value));
  const weightedCounts = countWeightedEntries(entries);
  const rank = new Map(order.map((value, index) => [value, index]));
  const rankedEntries = entries
    .filter((entry) => rank.has(entry.value))
    .sort((left, right) => (rank.get(left.value) ?? 0) - (rank.get(right.value) ?? 0));
  const rankedValues = rankedEntries
    .map((entry) => entry.value)
    .sort((left, right) => (rank.get(left) ?? 0) - (rank.get(right) ?? 0));
  const weightedMedian = chooseWeightedOrdinalMedian(rankedEntries, order);
  const aggregate: Record<string, unknown> = {
    primary: weightedMedian ?? choosePrimary(counts, weightedCounts),
    values: Object.keys(counts),
    counts,
    weighted_counts: weightedCounts,
    observed_count: entries.length,
  };

  if (rankedValues.length > 0) {
    aggregate.ordinal = {
      min: rankedValues[0],
      median: weightedMedian,
      max: rankedValues[rankedValues.length - 1],
    };
  }

  return aggregate;
}

function aggregateSizedItems(
  reports: ClimbingTourAggregationReport[],
  path: string,
): Record<string, unknown> | null {
  const groessen: string[] = [];
  const anzahlValues: number[] = [];
  let observedCount = 0;

  for (const report of reports) {
    const items = getArray<Record<string, unknown>>(report, path);
    if (items.length > 0) {
      observedCount += 1;
    }

    for (const item of items) {
      if (typeof item.groesse === 'string') {
        const groesse = normalizeProtectionSize(item.groesse);
        if (groesse) {
          groessen.push(groesse);
        }
      }

      if (isFiniteNumber(item.anzahl)) {
        anzahlValues.push(item.anzahl);
      }
    }
  }

  if (observedCount === 0) {
    return null;
  }

  return {
    groesse:
      groessen.length > 0
        ? {
            values: Object.keys(countEntries(groessen)),
            counts: countEntries(groessen),
            observed_count: groessen.length,
          }
        : null,
    anzahl: aggregateDiscreteValues(anzahlValues),
    observed_count: observedCount,
  };
}

function aggregateSlings(reports: ClimbingTourAggregationReport[]): Record<string, unknown> | null {
  const lengths: number[] = [];
  const counts: number[] = [];
  let observedCount = 0;

  for (const report of reports) {
    const items = getArray<Record<string, unknown>>(report, 'ausruestung.schlingen');
    if (items.length > 0) {
      observedCount += 1;
    }

    for (const item of items) {
      if (isFiniteNumber(item.laenge_cm)) {
        lengths.push(item.laenge_cm);
      }
      if (isFiniteNumber(item.anzahl)) {
        counts.push(item.anzahl);
      }
    }
  }

  if (observedCount === 0) {
    return null;
  }

  return {
    laenge_cm: aggregateDiscreteValues(lengths),
    anzahl: aggregateDiscreteValues(counts),
    observed_count: observedCount,
  };
}

function aggregateNamedItems(
  reports: ClimbingTourAggregationReport[],
  path: string,
): Record<string, unknown> | null {
  const types: Array<{ value: string; weight: number }> = [];
  const anders: string[] = [];
  let observedCount = 0;

  for (const report of reports) {
    const items = getArray<unknown>(report, path);
    if (items.length > 0) {
      observedCount += 1;
    }

    const reportTypes = new Set<string>();
    for (const item of items) {
      if (typeof item === 'string') {
        const value = normalizeLiteral(item);
        if (value) {
          reportTypes.add(value);
        }
        continue;
      }

      if (!item || typeof item !== 'object') {
        continue;
      }

      const record = item as Record<string, unknown>;
      const typ = typeof record.typ === 'string' ? normalizeLiteral(record.typ) : '';
      if (typ) {
        reportTypes.add(typ);
      }

      if (typeof record.anders === 'string') {
        const andersValue = normalizeFreeValue(record.anders);
        if (andersValue) {
          anders.push(andersValue);
        }
      }
    }

    for (const value of reportTypes) {
      types.push({ value, weight: getWeight(report) });
    }
  }

  if (observedCount === 0) {
    return null;
  }

  const typeCounts = countEntries(types.map((entry) => entry.value));
  const andersCounts = countEntries(anders);

  return {
    typ: {
      values: Object.keys(typeCounts),
      counts: typeCounts,
      weighted_counts: countWeightedEntries(types),
      observed_count: observedCount,
    },
    anders:
      anders.length > 0
        ? { values: Object.keys(andersCounts), counts: andersCounts, observed_count: anders.length }
        : null,
    observed_count: observedCount,
  };
}

function aggregateHazards(
  reports: ClimbingTourAggregationReport[],
): Record<string, unknown> | null {
  const types: Array<{ value: string; weight: number }> = [];
  const anders: string[] = [];
  const byTyp: Record<string, { observed_count: number }> = {};
  let observedCount = 0;

  for (const report of reports) {
    const hazards = getArray<Record<string, unknown>>(report, 'gelaende_und_gefahren.gefahren');
    if (hazards.length > 0) {
      observedCount += 1;
    }

    const reportTypes = new Set<string>();
    for (const hazard of hazards) {
      const typ = typeof hazard.typ === 'string' ? normalizeLiteral(hazard.typ) : '';
      if (typ) {
        reportTypes.add(typ);
        byTyp[typ] ??= { observed_count: 0 };
        byTyp[typ].observed_count += 1;
      }

      if (typeof hazard.anders === 'string') {
        const andersValue = normalizeFreeValue(hazard.anders);
        if (andersValue) {
          anders.push(andersValue);
        }
      }
    }

    for (const value of reportTypes) {
      types.push({ value, weight: getWeight(report) });
    }
  }

  if (observedCount === 0) {
    return null;
  }

  const typeCounts = countEntries(types.map((entry) => entry.value));
  const andersCounts = countEntries(anders);

  return {
    typ: {
      values: Object.keys(typeCounts),
      counts: typeCounts,
      weighted_counts: countWeightedEntries(types),
      observed_count: observedCount,
    },
    anders:
      anders.length > 0
        ? { values: Object.keys(andersCounts), counts: andersCounts, observed_count: anders.length }
        : null,
    by_typ: byTyp,
    observed_count: observedCount,
  };
}

function aggregatePitches(
  reports: ClimbingTourAggregationReport[],
): Record<string, unknown> | null {
  const byNumber = new Map<number, Array<{ pitch: Record<string, unknown>; weight: number }>>();
  let observedCount = 0;

  for (const report of reports) {
    const pitches = getArray<Record<string, unknown>>(
      report,
      'klettern.seillaengen_info.seillaengen',
    );
    if (pitches.length > 0) {
      observedCount += 1;
    }

    for (const pitch of pitches) {
      if (typeof pitch.nummer !== 'number' || !Number.isInteger(pitch.nummer)) {
        continue;
      }

      const current = byNumber.get(pitch.nummer) ?? [];
      current.push({ pitch, weight: getWeight(report) });
      byNumber.set(pitch.nummer, current);
    }
  }

  if (observedCount === 0) {
    return null;
  }

  const byNummer: Record<string, unknown> = {};
  for (const [nummer, pitchEntries] of [...byNumber.entries()].sort(
    ([left], [right]) => left - right,
  )) {
    const schwierigkeitsEntries = pitchEntries
      .map(({ pitch, weight }) => {
        const value =
          typeof pitch.schwierigkeit === 'string'
            ? normalizePitchDifficulty(pitch.schwierigkeit)
            : '';
        return value ? { value, weight } : null;
      })
      .filter((entry): entry is { value: string; weight: number } => entry !== null);
    const schwierigkeitsCounts = countEntries(schwierigkeitsEntries.map((entry) => entry.value));
    const schwierigkeitsWeightedCounts = countWeightedEntries(schwierigkeitsEntries);

    byNummer[nummer.toString()] = {
      schwierigkeit:
        Object.keys(schwierigkeitsCounts).length > 0
          ? {
              primary: choosePrimary(schwierigkeitsCounts, schwierigkeitsWeightedCounts),
              values: Object.keys(schwierigkeitsCounts),
              counts: schwierigkeitsCounts,
              weighted_counts: schwierigkeitsWeightedCounts,
              observed_count: Object.values(schwierigkeitsCounts).reduce(
                (sum, count) => sum + count,
                0,
              ),
            }
          : null,
      anzahl_bohrhaken: aggregateDiscreteValues(
        pitchEntries.map(({ pitch }) => pitch.anzahl_bohrhaken),
      ),
      laenge_m: aggregateContinuousValues(pitchEntries.map(({ pitch }) => pitch.laenge_m)),
      observed_count: pitchEntries.length,
    };
  }

  return { by_nummer: byNummer, observed_count: observedCount };
}

function aggregateCruxPresence(
  reports: ClimbingTourAggregationReport[],
): Record<string, unknown> | null {
  const observedCount = reports.filter(
    (report) => getArray<unknown>(report, 'klettern.schluesselstellen.stellen').length > 0,
  ).length;

  return observedCount === 0 ? null : { observed_count: observedCount };
}

function aggregateStringArrayCounts(
  reports: ClimbingTourAggregationReport[],
  path: string,
): Record<string, unknown> | null {
  const values: string[] = [];
  let observedCount = 0;

  for (const report of reports) {
    const reportValues = new Set(
      getArray<unknown>(report, path)
        .map((value) => (typeof value === 'string' ? normalizePreservingCase(value) : ''))
        .filter(Boolean),
    );
    if (reportValues.size === 0) {
      continue;
    }
    observedCount += 1;
    values.push(...reportValues);
  }

  if (values.length === 0) {
    return null;
  }

  const counts = countEntries(values);
  return { values: Object.keys(counts), counts, observed_count: observedCount };
}

function collectScalarValues(
  reports: ClimbingTourAggregationReport[],
  path: string,
  normalize: Normalizer,
): Array<{ value: string; weight: number }> {
  return reports
    .map((report) => {
      const value = getPath(report.details, path);
      if (typeof value !== 'string') {
        return null;
      }

      const normalized = normalize(value);
      return normalized ? { value: normalized, weight: getWeight(report) } : null;
    })
    .filter((entry): entry is { value: string; weight: number } => entry !== null);
}

function countEntries(values: string[]): Counts {
  return values.reduce<Counts>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function simpleCounts(values: string[]): Counts {
  return countEntries(values.filter(Boolean));
}

function countWeightedEntries(entries: Array<{ value: string; weight: number }>): WeightedCounts {
  return entries.reduce<WeightedCounts>((counts, entry) => {
    counts[entry.value] = (counts[entry.value] ?? 0) + entry.weight;
    return counts;
  }, {});
}

function choosePrimary(counts: Counts, weightedCounts: WeightedCounts): string | null {
  return (
    Object.keys(counts).sort((left, right) => {
      const weightedDifference = (weightedCounts[right] ?? 0) - (weightedCounts[left] ?? 0);
      if (weightedDifference !== 0) {
        return weightedDifference;
      }

      const countDifference = (counts[right] ?? 0) - (counts[left] ?? 0);
      return countDifference === 0 ? left.localeCompare(right) : countDifference;
    })[0] ?? null
  );
}

function chooseConservativePrimary(counts: Counts, order: string[]): string | null {
  return order.find((value) => (counts[value] ?? 0) > 0) ?? chooseMode(counts);
}

function chooseMode(counts: Counts): string | null {
  return (
    Object.keys(counts).sort((left, right) => {
      const countDifference = (counts[right] ?? 0) - (counts[left] ?? 0);
      return countDifference === 0 ? left.localeCompare(right) : countDifference;
    })[0] ?? null
  );
}

function chooseWeightedOrdinalMedian(
  entries: Array<{ value: string; weight: number }>,
  order: string[],
): string | null {
  if (entries.length === 0) {
    return null;
  }

  const rank = new Map(order.map((value, index) => [value, index]));
  const sorted = entries
    .filter((entry) => rank.has(entry.value))
    .sort((left, right) => (rank.get(left.value) ?? 0) - (rank.get(right.value) ?? 0));
  const totalWeight = sorted.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight <= 0) {
    return null;
  }

  const midpoint = totalWeight / 2;
  let cumulative = 0;
  for (const [index, entry] of sorted.entries()) {
    cumulative += entry.weight;
    if (cumulative > midpoint) {
      return entry.value;
    }
    if (cumulative === midpoint) {
      return sorted[index + 1]?.value ?? entry.value;
    }
  }

  return sorted[sorted.length - 1]?.value ?? null;
}

function median(values: number[]): number {
  const middle = Math.floor(values.length / 2);
  if (values.length % 2 === 1) {
    return values[middle];
  }

  return (values[middle - 1] + values[middle]) / 2;
}

function getString(report: ClimbingTourAggregationReport, path: string): string | null {
  const value = getPath(report.details, path);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getArray<T>(report: ClimbingTourAggregationReport, path: string): T[] {
  const value = getPath(report.details, path);
  return Array.isArray(value) ? (value as T[]) : [];
}

function getPath(input: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, input);
}

function setIfPresent(payload: Record<string, unknown>, path: string, value: unknown): void {
  if (value !== null && value !== undefined) {
    setPath(payload, path, value);
  }
}

function mergeAggregateObject(
  payload: Record<string, unknown>,
  path: string,
  value: Record<string, unknown>,
): void {
  const existing = getPath(payload, path);
  setPath(payload, path, {
    ...(isPlainObject(existing) ? existing : {}),
    ...value,
  });
}

function setPath(payload: Record<string, unknown>, path: string, value: unknown): void {
  const segments = path.split('.');
  let current: Record<string, unknown> = payload;

  for (const segment of segments.slice(0, -1)) {
    const existing = current[segment];
    if (!existing || typeof existing !== 'object' || Array.isArray(existing)) {
      current[segment] = {};
    }
    current = current[segment] as Record<string, unknown>;
  }

  current[segments[segments.length - 1]] = value;
}

function evidence(report: ClimbingTourAggregationReport, text: string): TextEvidenceItem {
  return {
    reportId: report.reportId.toString(),
    tourDate: formatDate(report.tourDate),
    qualityScore: report.qualityScore,
    text,
  };
}

function formatDate(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

function getWeight(report: ClimbingTourAggregationReport): number {
  return report.qualityScore ?? 3;
}

function normalizeLiteral(value: string): string {
  return value.trim();
}

function normalizePreservingCase(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeFreeValue(value: string): string {
  return normalizePreservingCase(value).toLowerCase();
}

function normalizeProtectionSize(value: string): string {
  return normalizeFreeValue(value)
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/\s*[-–—]\s*/g, '-');
}

function normalizePitchDifficulty(value: string): string {
  return normalizeClimbingDifficultyValue(value) ?? normalizePreservingCase(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function orderObject(value: unknown, path = ''): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => orderObject(item, path));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const keys = Object.keys(value);
  const keyOrder = KEY_ORDER_BY_PATH[path] ?? inferGenericKeyOrder(keys);
  const orderedKeys = [
    ...keyOrder.filter((key) => Object.prototype.hasOwnProperty.call(value, key)),
    ...keys
      .filter((key) => !keyOrder.includes(key))
      .sort((left, right) => left.localeCompare(right)),
  ];

  return orderedKeys.reduce<Record<string, unknown>>((ordered, key) => {
    const childPath = path ? `${path}.${key}` : key;
    ordered[key] = orderObject(value[key], childPath);
    return ordered;
  }, {});
}

function inferGenericKeyOrder(keys: string[]): string[] {
  return keys.some((key) => GENERIC_AGGREGATE_KEY_ORDER.includes(key))
    ? GENERIC_AGGREGATE_KEY_ORDER
    : [];
}
