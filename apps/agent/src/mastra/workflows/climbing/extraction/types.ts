import type { ClimbingPreprocessorOutput } from '../preprocessor';

export const CLIMBING_EXTRACTION_SCHEMA_VERSION = 'climbing-extraction-v1';

export const climbingExtractionAgentResultSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['schemaVersion'],
  properties: {
    schemaVersion: {
      enum: [CLIMBING_EXTRACTION_SCHEMA_VERSION],
      description: 'Version identifier for this climbing extraction output schema.',
    },
    ausruestung: {
      type: 'object',
      additionalProperties: false,
      description: 'Equipment explicitly mentioned for the climbing tour.',
      properties: {
        seil: {
          type: 'object',
          additionalProperties: false,
          description: 'Rope information explicitly mentioned in the report.',
          properties: {
            art: {
              enum: ['halbseil', 'zwillingsseil', 'einfachseil', null],
              description: 'Mentioned rope type, or null when no rope type is stated.',
            },
            laenge_m: {
              type: ['integer', 'null'],
              description: 'Length of the carried rope in meters, without the unit.',
            },
          },
        },
        mobile_absicherung: {
          type: 'object',
          additionalProperties: false,
          description: 'Mobile protection requirements, recommendations, and used gear.',
          properties: {
            erforderlich: {
              type: ['boolean', 'null'],
              description: 'Whether mobile protection is explicitly described as necessary.',
            },
            empfohlen: {
              type: ['boolean', 'null'],
              description:
                'Whether mobile protection is explicitly recommended, even if the route is otherwise protected.',
            },
            verwendet: {
              type: ['boolean', 'null'],
              description: 'Whether the report explicitly says mobile protection was used.',
            },
            moeglichkeiten: {
              type: ['string', 'null'],
              description: 'Description of how well or how often mobile protection can be placed.',
            },
            friends: {
              type: 'array',
              description: 'Mentioned cams or Friends, grouped by size and count.',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  groesse: {
                    type: ['string', 'null'],
                    description: 'Mentioned cam or Friend size.',
                  },
                  anzahl: {
                    type: ['integer', 'null'],
                    description: 'Mentioned number of cams or Friends of this size.',
                  },
                },
              },
            },
            keile: {
              type: 'array',
              description: 'Mentioned nuts or wedges, grouped by size and count.',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  groesse: {
                    type: ['string', 'null'],
                    description: 'Mentioned nut or wedge size.',
                  },
                  anzahl: {
                    type: ['integer', 'null'],
                    description: 'Mentioned number of nuts or wedges of this size.',
                  },
                },
              },
            },
          },
        },
        schlingen: {
          type: 'array',
          description:
            'Mentioned slings, including quickdraw slings, alpine slings, or other slings.',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              typ: {
                type: ['string', 'null'],
                description: 'Mentioned sling type.',
              },
              laenge_cm: {
                type: ['integer', 'null'],
                description: 'Mentioned sling length in centimeters, without the unit.',
              },
              anzahl: {
                type: ['integer', 'null'],
                description: 'Mentioned number of slings of this type or length.',
              },
            },
          },
        },
        expresskarabiner: {
          type: 'object',
          additionalProperties: false,
          description: 'Quickdraw information explicitly mentioned in the report.',
          properties: {
            anzahl: {
              type: ['integer', 'null'],
              description: 'Number of quickdraws carried or recommended.',
            },
          },
        },
        zusaetzlich: {
          type: 'array',
          description: 'Additional explicitly mentioned equipment that does not fit another field.',
          items: { type: 'string' },
        },
      },
    },
    zeitbedarf: {
      type: 'object',
      additionalProperties: false,
      description: 'Time requirements explicitly stated or directly normalized from the report.',
      properties: {
        zustieg_min: {
          type: ['integer', 'null'],
          description: 'Approach duration in minutes, excluding climbing and descent.',
        },
        reine_kletterzeit_min: {
          type: ['integer', 'null'],
          description: 'Pure climbing duration in minutes, excluding approach and descent.',
        },
        abstieg_min: {
          type: ['integer', 'null'],
          description: 'Descent duration in minutes, starting at the summit or route exit.',
        },
      },
    },
    absicherung: {
      type: 'object',
      additionalProperties: false,
      description: 'Protection and fixed-anchor information explicitly mentioned in the report.',
      properties: {
        hakenabstaende: {
          type: 'object',
          additionalProperties: false,
          description: 'Spacing of bolts or fixed pitons where they are mentioned.',
          properties: {
            bewertung: {
              enum: ['sehr_gut', 'gut', 'mittel', 'schlecht', null],
              description:
                'Assessment of bolt or fixed-piton spacing compared with expectations, only when such protection is mentioned.',
            },
            beschreibung: {
              type: ['string', 'null'],
              description: 'Reasoning or details about bolt or fixed-piton spacing.',
            },
          },
        },
        staende: {
          type: 'object',
          additionalProperties: false,
          description: 'Belay station setup and condition.',
          properties: {
            gebohrt: {
              type: ['boolean', 'null'],
              description: 'Whether belay stations are explicitly described as bolted or equipped.',
            },
            beschreibung: {
              type: ['string', 'null'],
              description:
                'Details about belay stations, such as condition, material, or reliability.',
            },
          },
        },
        hakenzustand: {
          type: 'object',
          additionalProperties: false,
          description: 'Condition of existing bolts or fixed pitons.',
          properties: {
            bewertung: {
              enum: ['gut', 'mittel', 'schlecht', null],
              description: 'Assessment of the condition of existing bolts or fixed pitons.',
            },
            beschreibung: {
              type: ['string', 'null'],
              description:
                'Notes about bolts or fixed pitons, such as rusty, old, glue-in bolts, expansion bolts, or renovated protection.',
            },
          },
        },
      },
    },
    schuhwerk: {
      type: 'object',
      additionalProperties: false,
      description: 'Footwear explicitly mentioned for each part of the tour.',
      properties: {
        zustieg: {
          type: 'object',
          additionalProperties: false,
          description: 'Footwear used or recommended for the approach.',
          properties: {
            typ: {
              enum: ['bergschuhe', 'zustiegsschuhe', 'turnschuhe', null],
              description: 'Footwear for the approach.',
            },
          },
        },
        klettern: {
          type: 'object',
          additionalProperties: false,
          description: 'Footwear used or recommended while climbing the route.',
          properties: {
            typ: {
              enum: ['kletterschuhe', 'bergschuhe', 'zustiegsschuhe', null],
              description: 'Footwear while climbing the route.',
            },
          },
        },
        abstieg: {
          type: 'object',
          additionalProperties: false,
          description: 'Footwear used or recommended for the descent.',
          properties: {
            typ: {
              enum: ['bergschuhe', 'zustiegsschuhe', 'turnschuhe', null],
              description: 'Footwear for the descent.',
            },
          },
        },
      },
    },
    gelaende_und_gefahren: {
      type: 'object',
      additionalProperties: false,
      description: 'Terrain character and hazards explicitly mentioned in the report.',
      properties: {
        charakter: {
          type: 'object',
          additionalProperties: false,
          description: 'Route or wall character explicitly described in the report.',
          properties: {
            exposition: {
              type: ['string', 'null'],
              description: 'Exposure of the route or wall, such as SO, SW, or N.',
            },
            sonnig: {
              type: ['boolean', 'null'],
              description: 'Whether a sunny position is explicitly mentioned.',
            },
            schnell_trocknend: {
              type: ['boolean', 'null'],
              description:
                'Whether the rock is explicitly described as drying quickly after wetness.',
            },
            felsart: {
              enum: [
                'granit',
                'gneis',
                'kalk',
                'dolomit',
                'sandstein',
                'quarzit',
                'schiefer',
                'konglomerat',
                'nagelfluh',
                'serpentinit',
                'basalt',
                null,
              ],
              description: 'Mentioned rock type.',
            },
          },
        },
        gefahren: {
          type: 'array',
          description:
            'Hazards mentioned for the approach, climb, or descent, such as loose rock, rockfall, grass, wetness, or route-finding errors.',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              typ: {
                type: 'string',
                description: 'Hazard type named in the report.',
              },
              beschreibung: {
                type: ['string', 'null'],
                description: 'Additional description or context for the hazard.',
              },
            },
          },
        },
      },
    },
    klettern: {
      type: 'object',
      additionalProperties: false,
      description: 'Climbing-specific route details explicitly mentioned in the report.',
      properties: {
        schluesselstellen: {
          type: 'object',
          additionalProperties: false,
          description: 'Crux information explicitly mentioned in the report.',
          properties: {
            vorhanden: {
              type: ['boolean', 'null'],
              description: 'Whether at least one crux is explicitly mentioned.',
            },
            stellen: {
              type: 'array',
              description: 'Positions and descriptions of mentioned cruxes.',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  wo: {
                    type: ['string', 'null'],
                    description: 'Position of the crux, such as pitch number or route section.',
                  },
                  beschreibung: {
                    type: ['string', 'null'],
                    description: 'Description of the crux.',
                  },
                },
              },
            },
          },
        },
        schwierigkeit: {
          type: 'object',
          additionalProperties: false,
          description: 'Difficulty impression compared with the official or expected grade.',
          properties: {
            verhaeltnis: {
              enum: ['leichter', 'wie_bewertet', 'schwerer', null],
              description: 'Difficulty impression relative to the official or expected grade.',
            },
            beschreibung: {
              type: ['string', 'null'],
              description: 'Explanation for the difficulty impression.',
            },
          },
        },
        abseilen: {
          type: 'object',
          additionalProperties: false,
          description: 'Rappelling information for descent or retreat.',
          properties: {
            moeglich: {
              type: ['boolean', 'null'],
              description:
                'Whether rappelling is explicitly mentioned as a descent or retreat option.',
            },
            anzahl: {
              type: ['integer', 'null'],
              description: 'Number of required or described rappels.',
            },
            laengen_m: {
              type: 'array',
              description: 'Individual rappel lengths in meters, without the unit.',
              items: { type: 'integer' },
            },
            zum_einstieg: {
              type: ['boolean', 'null'],
              description: 'Whether rappelling directly back to the route start is possible.',
            },
            abseilpiste: {
              type: ['boolean', 'null'],
              description: 'Whether a dedicated rappel line or rappel route exists.',
            },
          },
        },
        charakter: {
          type: 'object',
          additionalProperties: false,
          description: 'Climbing style and movement character.',
          properties: {
            kletterstil: {
              type: 'array',
              description: 'Mentioned climbing styles.',
              items: {
                enum: [
                  'platte',
                  'riss',
                  'grat',
                  'kante',
                  'wand',
                  'verschneidung',
                  'ueberhang',
                  'dach',
                  'pfeiler',
                  'kamin',
                ],
              },
            },
          },
        },
        routenverlauf: {
          type: 'object',
          additionalProperties: false,
          description: 'Route line, orientation, and retreat information.',
          properties: {
            routenfindung: {
              enum: ['einfach', 'mittel', 'schwierig', null],
              description: 'Difficulty of route finding.',
            },
            beschreibung: {
              type: ['string', 'null'],
              description: 'Notes about the route line, orientation, or possible wrong turns.',
            },
            rueckzug_moeglich: {
              type: ['boolean', 'null'],
              description: 'Whether retreat or escape options on the route are mentioned.',
            },
            rueckzug_beschreibung: {
              type: ['string', 'null'],
              description: 'Where and how retreat is possible.',
            },
          },
        },
        seillaengen_verbinden: {
          type: 'object',
          additionalProperties: false,
          description: 'Information about linking pitches.',
          properties: {
            moeglich: {
              type: ['boolean', 'null'],
              description: 'Whether pitches can explicitly be linked.',
            },
            beschreibung: {
              type: ['string', 'null'],
              description: 'Which pitches can be linked and under what conditions.',
            },
          },
        },
        seillaengen: {
          type: 'array',
          description: 'Structured descriptions of individual pitches.',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              nummer: {
                type: ['integer', 'null'],
                description: 'Pitch number.',
              },
              schwierigkeit: {
                type: ['string', 'null'],
                description: 'Difficulty grade stated for this pitch.',
              },
              anzahl_bohrhaken: {
                type: ['integer', 'null'],
                description: 'Number of bolts stated for this pitch.',
              },
              laenge_m: {
                type: ['integer', 'null'],
                description: 'Pitch length in meters, without the unit.',
              },
              beschreibung: {
                type: ['string', 'null'],
                description: 'Description of this pitch.',
              },
            },
          },
        },
      },
    },
    anreise: {
      type: 'object',
      additionalProperties: false,
      description: 'Arrival and access information explicitly mentioned in the report.',
      properties: {
        parkplatz: {
          type: 'object',
          additionalProperties: false,
          description: 'Parking information.',
          properties: {
            ort: {
              type: ['string', 'null'],
              description: 'Parking location or parking area name.',
            },
            kosten: {
              type: ['string', 'null'],
              description: 'Parking cost or fee information.',
            },
            besonderheiten: {
              type: ['string', 'null'],
              description:
                'Parking details such as limited spaces, narrow access, or filling up early.',
            },
          },
        },
        oev: {
          type: 'object',
          additionalProperties: false,
          description: 'Public transport information.',
          properties: {
            verkehrsmittel: {
              type: 'array',
              description:
                'Mentioned public transport modes, such as train, bus, call bus, or cable car.',
              items: { type: 'string' },
            },
            endstation: {
              type: ['string', 'null'],
              description: 'Stop or station used as the tour starting point.',
            },
            luftseilbahn_moeglich: {
              type: ['boolean', 'null'],
              description: 'Whether using a cable car is explicitly possible.',
            },
            anmeldung_noetig: {
              type: ['boolean', 'null'],
              description: 'Whether registration or reservation is explicitly required.',
            },
          },
        },
      },
    },
    zustieg_und_abstieg: {
      type: 'object',
      additionalProperties: false,
      description: 'Approach and descent details explicitly mentioned in the report.',
      properties: {
        zustieg: {
          type: 'object',
          additionalProperties: false,
          description: 'Approach to the route start.',
          properties: {
            einstiegsfindung: {
              enum: ['einfach', 'mittel', 'schwer', null],
              description: 'Difficulty of finding the route start.',
            },
            beschreibung: {
              type: ['string', 'null'],
              description: 'Where the route starts and how the start is found.',
            },
            schwierigkeit: {
              type: ['string', 'null'],
              description: 'Technical or alpine difficulty of the approach.',
            },
          },
        },
        abstieg: {
          type: 'object',
          additionalProperties: false,
          description: 'Descent from the summit or route exit.',
          properties: {
            fuehrt_zum_einstieg: {
              type: ['boolean', 'null'],
              description: 'Whether the descent passes the route start again.',
            },
            verpflegung_moeglich: {
              type: ['boolean', 'null'],
              description:
                'Whether the descent passes a hut, restaurant, or another place to get food or drinks.',
            },
            verpflegung_beschreibung: {
              type: ['string', 'null'],
              description: 'Name or location of the food or drink option.',
            },
            schwierigkeit: {
              type: ['string', 'null'],
              description: 'Difficulty of the descent and concrete challenges.',
            },
          },
        },
      },
    },
    besonderes: {
      type: 'object',
      additionalProperties: false,
      description: 'Additional notes that do not fit another category.',
      properties: {
        saisonalitaet: {
          type: ['string', 'null'],
          description:
            'Seasonal notes, such as especially suitable or unsuitable seasons, or avoiding the route after rain.',
        },
        hinweise: {
          type: 'array',
          description: 'Other relevant explicit notes that do not fit another category.',
          items: { type: 'string' },
        },
      },
    },
  },
} as const;

type DeepOptional<T> =
  T extends Array<infer U>
    ? Array<DeepOptional<U>>
    : T extends object
      ? { [K in keyof T]?: DeepOptional<T[K]> }
      : T;

type ClimbingExtractionFields = {
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

export type ClimbingExtractionAgentResult = {
  schemaVersion: typeof CLIMBING_EXTRACTION_SCHEMA_VERSION;
} & DeepOptional<ClimbingExtractionFields>;

export type ClimbingExtractionOutput = ClimbingPreprocessorOutput & {
  extraction: ClimbingExtractionAgentResult | null;
};

export type ClimbingExtractorInput = {
  title: string | null;
  preprocessed: ClimbingPreprocessorOutput;
};

export type ClimbingExtractor = (
  input: ClimbingExtractorInput,
) => Promise<ClimbingExtractionAgentResult>;
