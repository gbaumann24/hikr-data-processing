import type {
  ClimbingGardenBaseSchema,
  ClimbingTourBaseSchema,
  ReportBaseSchema,
  RouteSchema,
} from '../../generated/client';

export type ReportBaseSchemaWriteInput = Pick<
  ReportBaseSchema,
  'reportId' | 'status' | 'activity' | 'subActivity' | 'canton' | 'tourDate' | 'region' | 'reasons'
>;

export type RouteSchemaWriteInput = Pick<
  RouteSchema,
  | 'activity'
  | 'subActivity'
  | 'routeName'
  | 'routeNames'
  | 'startPoint'
  | 'summitId'
  | 'cragName'
  | 'canton'
>;

export type RouteSummitNamesLookupInput = Pick<RouteSchemaWriteInput, 'activity' | 'canton'> & {
  subActivity: string;
};

export type RouteNamesLookupInput = Pick<RouteSchemaWriteInput, 'activity' | 'canton'> & {
  subActivity: string;
  summitName: string;
};

export type RouteNamesLookupOutput = {
  routeName: string;
  routeNames: string[];
};

export type RouteCragNamesLookupInput = Pick<RouteSchemaWriteInput, 'activity' | 'canton'> & {
  subActivity: string;
};

export type ClimbingTourBasePreprocessorOutput = Pick<
  ClimbingTourBaseSchema,
  'reportId' | 'schemaVersion'
> & {
  routeName: string;
  routeNames: string[];
  summit: string;
};

export type ClimbingGardenBasePreprocessorOutput = Pick<
  ClimbingGardenBaseSchema,
  'reportId' | 'name'
>;

type DeepOptional<T> =
  T extends Array<infer U>
    ? Array<DeepOptional<U>>
    : T extends object
      ? { [K in keyof T]?: DeepOptional<T[K]> }
      : T;

type ClimbingTourSeasonality = {
  geeignet?: string[];
  ungeeignet?: string[];
  anders?: string | null;
};

type NamedExtractionItem = {
  typ: string | null;
  anders?: string | null;
};

type ClimbingTourDetailsFields = {
  zusammenfassung: string | null;
  ausruestung: {
    seil: {
      art: string | null;
      anders?: string | null;
      laenge_m: number | null;
    };
    mobile_absicherung: {
      notwendigkeit: string[];
      begruendung: string | null;
      moeglichkeiten: string | null;
      friends: Array<{ groesse: string | null; anzahl: number | null }>;
      keile: Array<{ groesse: string | null; anzahl: number | null }>;
    };
    schlingen: Array<{ laenge_cm: number | null; anzahl: number | null }>;
    expresskarabiner: { anzahl: number | null };
    zusaetzlich: Array<string | NamedExtractionItem>;
  };
  zeitbedarf: {
    zustieg_min: number | null;
    reine_kletterzeit_min: number | null;
    abstieg_min: number | null;
  };
  absicherung: {
    charakter: string | null;
    hakentypen: string[];
    hakentypen_anders: string[];
    hakenabstaende: {
      bewertung: string | null;
      beschreibung: string | null;
    };
    staende: {
      gebohrt: boolean | null;
      beschreibung: string | null;
    };
    hakenzustand: {
      bewertung: string | null;
      beschreibung: string | null;
    };
  };
  schuhwerk: {
    zustieg: NamedExtractionItem;
    klettern: NamedExtractionItem;
    abstieg: NamedExtractionItem;
  };
  gelaende_und_gefahren: {
    charakter: {
      exposition: string | null;
      sonnig: boolean | null;
      schnell_trocknend: boolean | null;
      felsart: string | null;
      anders?: string | null;
      beschreibung: string | null;
    };
    gefahren: Array<NamedExtractionItem & { beschreibung: string | null }>;
    felsqualitaet: string[];
    felsqualitaet_anders: string[];
  };
  klettern: {
    schluesselstellen: {
      stellen: Array<{ wo: string | null; beschreibung: string | null }>;
    };
    schwierigkeit: {
      verhaeltnis: string | null;
      beschreibung: string | null;
      min_klettererfahrung: string | null;
    };
    abseilen: {
      moeglich: boolean | null;
      abseil_max_laenge_m: number | null;
      zum_einstieg: boolean | null;
      abseilpiste: boolean | null;
      beschreibung: string | null;
    };
    charakter: {
      kletterstil: string[];
      anders: string[];
      beschreibung: string | null;
      schoenheit: string | null;
      ernsthaftigkeit: string | null;
      wandhoehe_m: number | null;
    };
    routenverlauf: {
      routenfindung: string | null;
      beschreibung: string | null;
      rueckzug_moeglich: boolean | null;
      rueckzug_beschreibung: string | null;
      einstiegshoehe_m: number | null;
    };
    seillaengen_info: {
      anzahl_total: number | null;
      verbinden: {
        moeglich: boolean | null;
        beschreibung: string | null;
      };
      seillaengen: Array<{
        nummer: number | null;
        schwierigkeit: string | null;
        anzahl_bohrhaken: number | null;
        laenge_m: number | null;
        beschreibung: string | null;
      }>;
    };
  };
  anreise: {
    ausgangspunkt: {
      name: string | null;
      hoehe_m: number | null;
    };
    parkplatz: {
      ort: string | null;
      hoehe_m: number | null;
      kosten: string | null;
      besonderheiten: string | null;
    };
    talstation: {
      name: string | null;
      hoehe_m: number | null;
    };
    oev: {
      verkehrsmittel: Array<string | NamedExtractionItem>;
      endstation: string | null;
      luftseilbahn_moeglich: boolean | null;
      anmeldung_noetig: boolean | null;
    };
    von_passhoehe_aus: string | null;
  };
  zustieg_und_abstieg: {
    zustieg: {
      einstiegsfindung: string | null;
      beschreibung: string | null;
      schwierigkeit: string | null;
      hm_aufstieg: number | null;
      hm_abstieg: number | null;
    };
    abstieg: {
      fuehrt_zum_einstieg: boolean | null;
      schwierigkeit: string | null;
      hm_aufstieg: number | null;
      hm_abstieg: number | null;
    };
    verpflegung_typ: string | null;
  };
  stuetzpunkt: {
    typ: string | null;
    mehrtags: boolean | null;
  };
  quellen: {
    kletterfuehrer: string[];
    topo_url: string[];
  };
  berichtsqualitaet: {
    score: number | null;
    begruendung: string | null;
  };
  besonderes: {
    saisonalitaet: string | ClimbingTourSeasonality | null;
    frequentierung: string | null;
    bedingungen: {
      fels_zustand: string | null;
      altschnee_auf_zustieg: boolean | null;
      beschreibung: string | null;
    } | null;
    hinweise: string[];
  };
};

export type ClimbingTourDetailsSchemaWriteInput = Pick<ClimbingTourBaseSchema, 'reportId'> & {
  schemaVersion: string;
} & DeepOptional<ClimbingTourDetailsFields>;
