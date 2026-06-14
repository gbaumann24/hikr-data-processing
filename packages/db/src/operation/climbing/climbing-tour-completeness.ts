import type { ClimbingTourDetailsSchemaWriteInput } from '../types';

export type ClimbingTourCompleteness = {
  score: number;
  filledFields: number;
  possibleFields: number;
};

type FieldSpec = {
  path: string;
  possibleWhen?: (input: ClimbingTourDetailsSchemaWriteInput) => boolean;
};

const COMPLETENESS_FIELDS: FieldSpec[] = [
  { path: 'zusammenfassung' },
  { path: 'ausruestung.seil.art' },
  {
    path: 'ausruestung.seil.anders',
    possibleWhen: hasScalarValue('ausruestung.seil.art', 'anders'),
  },
  { path: 'ausruestung.seil.laenge_m' },
  { path: 'ausruestung.mobile_absicherung.notwendigkeit' },
  { path: 'ausruestung.mobile_absicherung.begruendung' },
  { path: 'ausruestung.mobile_absicherung.moeglichkeiten' },
  { path: 'ausruestung.mobile_absicherung.friends' },
  { path: 'ausruestung.mobile_absicherung.keile' },
  { path: 'ausruestung.schlingen' },
  { path: 'ausruestung.expresskarabiner.anzahl' },
  { path: 'ausruestung.zusaetzlich' },
  { path: 'zeitbedarf.zustieg_min' },
  { path: 'zeitbedarf.reine_kletterzeit_min' },
  { path: 'zeitbedarf.abstieg_min' },
  { path: 'absicherung.charakter' },
  { path: 'absicherung.hakentypen' },
  {
    path: 'absicherung.hakentypen_anders',
    possibleWhen: hasArrayValue('absicherung.hakentypen', 'anders'),
  },
  { path: 'absicherung.hakenabstaende.bewertung' },
  { path: 'absicherung.hakenabstaende.beschreibung' },
  { path: 'absicherung.staende.gebohrt' },
  { path: 'absicherung.staende.beschreibung' },
  { path: 'absicherung.hakenzustand.bewertung' },
  { path: 'absicherung.hakenzustand.beschreibung' },
  { path: 'schuhwerk.zustieg.typ' },
  {
    path: 'schuhwerk.zustieg.anders',
    possibleWhen: hasScalarValue('schuhwerk.zustieg.typ', 'anders'),
  },
  { path: 'schuhwerk.klettern.typ' },
  {
    path: 'schuhwerk.klettern.anders',
    possibleWhen: hasScalarValue('schuhwerk.klettern.typ', 'anders'),
  },
  { path: 'schuhwerk.abstieg.typ' },
  {
    path: 'schuhwerk.abstieg.anders',
    possibleWhen: hasScalarValue('schuhwerk.abstieg.typ', 'anders'),
  },
  { path: 'gelaende_und_gefahren.charakter.exposition' },
  { path: 'gelaende_und_gefahren.charakter.sonnig' },
  { path: 'gelaende_und_gefahren.charakter.schnell_trocknend' },
  { path: 'gelaende_und_gefahren.charakter.felsart' },
  {
    path: 'gelaende_und_gefahren.charakter.anders',
    possibleWhen: hasScalarValue('gelaende_und_gefahren.charakter.felsart', 'anders'),
  },
  { path: 'gelaende_und_gefahren.charakter.beschreibung' },
  { path: 'gelaende_und_gefahren.gefahren' },
  { path: 'gelaende_und_gefahren.felsqualitaet' },
  {
    path: 'gelaende_und_gefahren.felsqualitaet_anders',
    possibleWhen: hasArrayValue('gelaende_und_gefahren.felsqualitaet', 'anders'),
  },
  { path: 'klettern.schluesselstellen.stellen' },
  { path: 'klettern.schwierigkeit.verhaeltnis' },
  { path: 'klettern.schwierigkeit.beschreibung' },
  { path: 'klettern.schwierigkeit.min_klettererfahrung' },
  { path: 'klettern.abseilen.moeglich' },
  { path: 'klettern.abseilen.abseil_max_laenge_m' },
  { path: 'klettern.abseilen.zum_einstieg' },
  { path: 'klettern.abseilen.abseilpiste' },
  { path: 'klettern.abseilen.beschreibung' },
  { path: 'klettern.charakter.kletterstil' },
  {
    path: 'klettern.charakter.anders',
    possibleWhen: hasArrayValue('klettern.charakter.kletterstil', 'anders'),
  },
  { path: 'klettern.charakter.beschreibung' },
  { path: 'klettern.charakter.schoenheit' },
  { path: 'klettern.charakter.ernsthaftigkeit' },
  { path: 'klettern.charakter.wandhoehe_m' },
  { path: 'klettern.routenverlauf.routenfindung' },
  { path: 'klettern.routenverlauf.beschreibung' },
  { path: 'klettern.routenverlauf.rueckzug_moeglich' },
  { path: 'klettern.routenverlauf.rueckzug_beschreibung' },
  { path: 'klettern.routenverlauf.einstiegshoehe_m' },
  { path: 'klettern.seillaengen_info.anzahl_total' },
  { path: 'klettern.seillaengen_info.verbinden.moeglich' },
  { path: 'klettern.seillaengen_info.verbinden.beschreibung' },
  { path: 'klettern.seillaengen_info.seillaengen' },
  { path: 'anreise.ausgangspunkt.name' },
  { path: 'anreise.ausgangspunkt.hoehe_m' },
  { path: 'anreise.parkplatz.ort' },
  { path: 'anreise.parkplatz.hoehe_m' },
  { path: 'anreise.parkplatz.kosten' },
  { path: 'anreise.parkplatz.besonderheiten' },
  { path: 'anreise.talstation.name' },
  { path: 'anreise.talstation.hoehe_m' },
  { path: 'anreise.oev.verkehrsmittel' },
  { path: 'anreise.oev.endstation' },
  { path: 'anreise.oev.luftseilbahn_moeglich' },
  { path: 'anreise.oev.anmeldung_noetig' },
  { path: 'anreise.von_passhoehe_aus' },
  { path: 'zustieg_und_abstieg.zustieg.einstiegsfindung' },
  { path: 'zustieg_und_abstieg.zustieg.beschreibung' },
  { path: 'zustieg_und_abstieg.zustieg.schwierigkeit' },
  { path: 'zustieg_und_abstieg.zustieg.hm_aufstieg' },
  { path: 'zustieg_und_abstieg.zustieg.hm_abstieg' },
  { path: 'zustieg_und_abstieg.abstieg.fuehrt_zum_einstieg' },
  { path: 'zustieg_und_abstieg.abstieg.schwierigkeit' },
  { path: 'zustieg_und_abstieg.abstieg.hm_aufstieg' },
  { path: 'zustieg_und_abstieg.abstieg.hm_abstieg' },
  { path: 'zustieg_und_abstieg.verpflegung_typ' },
  { path: 'stuetzpunkt.typ' },
  { path: 'stuetzpunkt.mehrtags' },
  { path: 'quellen.kletterfuehrer' },
  { path: 'quellen.topo_url' },
  { path: 'besonderes.saisonalitaet.geeignet' },
  { path: 'besonderes.frequentierung' },
  { path: 'besonderes.bedingungen.fels_zustand' },
  { path: 'besonderes.bedingungen.altschnee_auf_zustieg' },
  { path: 'besonderes.bedingungen.beschreibung' },
  { path: 'besonderes.hinweise' },
];

export function computeClimbingTourCompleteness(
  input: ClimbingTourDetailsSchemaWriteInput,
): ClimbingTourCompleteness {
  let possibleFields = 0;
  let filledFields = 0;

  for (const field of COMPLETENESS_FIELDS) {
    if (field.possibleWhen && !field.possibleWhen(input)) {
      continue;
    }

    possibleFields += 1;

    if (isFilled(getPath(input, field.path))) {
      filledFields += 1;
    }
  }

  return {
    score: possibleFields === 0 ? 0 : Number((filledFields / possibleFields).toFixed(4)),
    filledFields,
    possibleFields,
  };
}

function hasScalarValue(
  path: string,
  expected: string,
): (input: ClimbingTourDetailsSchemaWriteInput) => boolean {
  return (input) => getPath(input, path) === expected;
}

function hasArrayValue(
  path: string,
  expected: string,
): (input: ClimbingTourDetailsSchemaWriteInput) => boolean {
  return (input) => {
    const value = getPath(input, path);
    return Array.isArray(value) && value.includes(expected);
  };
}

function getPath(input: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, input);
}

function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim() !== '';
  }

  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  if (typeof value === 'boolean') {
    return true;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
}
