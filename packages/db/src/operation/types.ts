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

type ClimbingTourDetailsFields = {
  ausruestung: {
    seil: {
      art: 'halbseil' | 'zwillingsseil' | 'einfachseil' | null;
      laenge_m: number | null;
    };
    mobile_absicherung: {
      erforderlich: boolean | null;
      empfohlen: boolean | null;
      verwendet: boolean | null;
      moeglichkeiten: string | null;
      friends: Array<{ groesse: string | null; anzahl: number | null }>;
      keile: Array<{ groesse: string | null; anzahl: number | null }>;
    };
    schlingen: Array<{ typ: string | null; laenge_cm: number | null; anzahl: number | null }>;
    expresskarabiner: { anzahl: number | null };
    zusaetzlich: string[];
  };
  zeitbedarf: {
    zustieg_min: number | null;
    reine_kletterzeit_min: number | null;
    abstieg_min: number | null;
  };
  absicherung: {
    hakenabstaende: {
      bewertung: 'sehr_gut' | 'gut' | 'mittel' | 'schlecht' | null;
      beschreibung: string | null;
    };
    staende: {
      gebohrt: boolean | null;
      beschreibung: string | null;
    };
    hakenzustand: {
      bewertung: 'gut' | 'mittel' | 'schlecht' | null;
      beschreibung: string | null;
    };
  };
  schuhwerk: {
    zustieg: { typ: 'bergschuhe' | 'zustiegsschuhe' | 'turnschuhe' | null };
    klettern: { typ: 'kletterschuhe' | 'bergschuhe' | 'zustiegsschuhe' | null };
    abstieg: { typ: 'bergschuhe' | 'zustiegsschuhe' | 'turnschuhe' | null };
  };
  gelaende_und_gefahren: {
    charakter: {
      exposition: string | null;
      sonnig: boolean | null;
      schnell_trocknend: boolean | null;
      felsart:
        | 'granit'
        | 'gneis'
        | 'kalk'
        | 'dolomit'
        | 'sandstein'
        | 'quarzit'
        | 'schiefer'
        | 'konglomerat'
        | 'nagelfluh'
        | 'serpentinit'
        | 'basalt'
        | null;
    };
    gefahren: Array<{ typ: string; beschreibung: string | null }>;
  };
  klettern: {
    schluesselstellen: {
      vorhanden: boolean | null;
      stellen: Array<{ wo: string | null; beschreibung: string | null }>;
    };
    schwierigkeit: {
      verhaeltnis: 'leichter' | 'wie_bewertet' | 'schwerer' | null;
      beschreibung: string | null;
    };
    abseilen: {
      moeglich: boolean | null;
      anzahl: number | null;
      laengen_m: number[];
      zum_einstieg: boolean | null;
      abseilpiste: boolean | null;
    };
    charakter: {
      kletterstil: Array<
        | 'platte'
        | 'riss'
        | 'grat'
        | 'kante'
        | 'wand'
        | 'verschneidung'
        | 'ueberhang'
        | 'dach'
        | 'pfeiler'
        | 'kamin'
      >;
    };
    routenverlauf: {
      routenfindung: 'einfach' | 'mittel' | 'schwierig' | null;
      beschreibung: string | null;
      rueckzug_moeglich: boolean | null;
      rueckzug_beschreibung: string | null;
    };
    seillaengen_verbinden: {
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
  anreise: {
    parkplatz: {
      ort: string | null;
      kosten: string | null;
      besonderheiten: string | null;
    };
    oev: {
      verkehrsmittel: string[];
      endstation: string | null;
      luftseilbahn_moeglich: boolean | null;
      anmeldung_noetig: boolean | null;
    };
  };
  zustieg_und_abstieg: {
    zustieg: {
      einstiegsfindung: 'einfach' | 'mittel' | 'schwer' | null;
      beschreibung: string | null;
      schwierigkeit: string | null;
    };
    abstieg: {
      fuehrt_zum_einstieg: boolean | null;
      verpflegung_moeglich: boolean | null;
      verpflegung_beschreibung: string | null;
      schwierigkeit: string | null;
    };
  };
  besonderes: {
    saisonalitaet: string | null;
    hinweise: string[];
  };
};

export type ClimbingTourDetailsSchemaWriteInput = Pick<ClimbingTourBaseSchema, 'reportId'> & {
  schemaVersion: string;
} & DeepOptional<ClimbingTourDetailsFields>;
