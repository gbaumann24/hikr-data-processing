import { z, type ZodRawShape } from 'zod';
import type { ClimbingPreprocessorOutput } from '../preprocessor';

export const CLIMBING_EXTRACTION_SCHEMA_VERSION = 'climbing-extraction-v1';

const climbingExtractionSchemaDescription = [
  'Extract machine-readable structured attributes for alpine climbing tours from Hikr tour reports.',
  'Use only explicit evidence from the report or preprocessor output; do not guess.',
  'Missing scalar leaf values may be omitted by the model, but when present and unknown they must be null.',
  'Array fields use [] as the empty value, contain deduplicated values, and never use null.',
  'Only obvious normalizations are allowed, such as converting "1 h 30" to 90 minutes.',
  'Store numbers without units because the unit is encoded in the field name.',
  'If statements conflict, prefer the more specific or more recent passage; if unresolved, output null.',
  'The route is only the climbing path from Einstieg to Ausstieg; Zustieg and Abstieg are separate, and Abstieg starts at the summit or Ausstieg.',
].join(' ');

// ─── Helper factories ─────────────────────────────────────────────────────────

const nullableString = (description: string) =>
  z.string().nullable().optional().describe(description);

const nullableInteger = (description: string) =>
  z.number().int().nullable().optional().describe(description);

const nullableBoolean = (description: string) =>
  z.boolean().nullable().optional().describe(description);

const nullableEnum = <const Values extends readonly [string, ...string[]]>(
  values: Values,
  description: string,
) => z.enum(values).nullable().optional().describe(description);

const optionalObject = <Shape extends ZodRawShape>(shape: Shape, description: string) =>
  z.object(shape).strict().optional().describe(description);

const stringArray = (description: string) => z.array(z.string()).optional().describe(description);

// ─── Reusable item schemas ────────────────────────────────────────────────────

const friendProtectionItemSchema = z
  .object({
    groesse: z
      .string()
      .nullable()
      .optional()
      .describe('Friend/Cam size, e.g. "0.75" or "0.3-2". Omit when only a count is mentioned.'),
    anzahl: z
      .number()
      .int()
      .nullable()
      .optional()
      .describe(
        'Number of Friends/Cams. Omit when no count is mentioned, even if sizes are present.',
      ),
  })
  .strict();

const nutProtectionItemSchema = z
  .object({
    groesse: z
      .string()
      .nullable()
      .optional()
      .describe('Nut/Klemmkeil size or set description. Omit when only a count is mentioned.'),
    anzahl: z
      .number()
      .int()
      .nullable()
      .optional()
      .describe(
        'Number of nuts/Klemmkeile. Omit when no count is mentioned, even if sizes are present.',
      ),
  })
  .strict();

const slingSchema = z
  .object({
    laenge_cm: z
      .number()
      .int()
      .nullable()
      .optional()
      .describe('Sling length in centimeters, e.g. "120er Schlinge" -> 120.'),
    anzahl: z
      .number()
      .int()
      .nullable()
      .optional()
      .describe('Number of slings. Omit when no count is mentioned.'),
  })
  .strict();

const hazardSchema = z
  .object({
    typ: z
      .enum([
        'steinschlag',
        'eisschlag',
        'bruechiger_fels',
        'naesse',
        'absturz',
        'verhauer',
        'wechten',
        'spalten',
        'gras',
        'lawine',
        'altschnee',
        'kaelte',
        'schrofen',
        'geroell',
        'anders',
      ])
      .describe('Hazard type. Use "anders" and fill `anders` for types not in the list.'),
    anders: nullableString('Free-text hazard type when `typ` is "anders", e.g. "Wildbach".'),
    beschreibung: z
      .string()
      .nullable()
      .describe(
        'Location and severity as a self-contained present-tense sentence, e.g. "Steinschlaggefahr im oberen Wandteil durch andere Seilschaften."',
      ),
  })
  .strict();

const cruxSchema = z
  .object({
    wo: z.string().optional().nullable(),
    beschreibung: z.string().nullable(),
  })
  .strict();

const pitchSchema = z
  .object({
    nummer: z.number().int().nullable(),
    schwierigkeit: z.string().nullable(),
    anzahl_bohrhaken: z.number().int().nullable(),
    laenge_m: z.number().int().nullable(),
    beschreibung: z.string().nullable(),
  })
  .strict();

const ausruestungZusaetzlichItemSchema = z
  .object({
    typ: z
      .enum([
        'helm',
        'klettergurt',
        'sicherungsgeraet',
        'abseilgeraet',
        'hms',
        'karabiner',
        'schraubkarabiner',
        'steigklemme',
        'klemmkeilentferner',
        'steigeisen',
        'pickel',
        'stirnlampe',
        'biwaksack',
        'chalkbag',
        'topo',
        'erste_hilfe_set',
        'rettungsdecke',
        'prusikschlinge',
        'funkgeraet',
        'mobiltelefon',
        'wanderstoecke',
        'anders',
      ])
      .describe(
        'Equipment type not covered by seil, mobile_absicherung, schlingen, or expresskarabiner. Use "anders" and fill `anders` for items not in the list. Do not capture clothing, food, or drink.',
      ),
    anders: nullableString(
      'Free-text equipment name when `typ` is "anders", e.g. "GPS-Geraet", "Seilsack", "Haulbag".',
    ),
  })
  .strict();

const verkehrsmittelItemSchema = z
  .object({
    typ: z
      .enum([
        'zug',
        'bus',
        'postauto',
        'tram',
        'luftseilbahn',
        'gondelbahn',
        'pendelbahn',
        'sesselbahn',
        'standseilbahn',
        'zahnradbahn',
        'schiff',
        'taxi',
        'rufbus',
        'anders',
      ])
      .describe('Public transport mode. Use "anders" and fill `anders` for modes not in the list.'),
    anders: nullableString('Free-text transport mode when `typ` is "anders".'),
  })
  .strict();

// ─── Main schema ──────────────────────────────────────────────────────────────

export const climbingExtractionAgentResultSchema = z
  .object({
    schemaVersion: z
      .literal(CLIMBING_EXTRACTION_SCHEMA_VERSION)
      .describe('Version identifier for this climbing extraction output schema.'),

    ausruestung: optionalObject(
      {
        seil: optionalObject(
          {
            art: nullableEnum(
              ['einfachseil', 'halbseil', 'zwillingsseil', 'statikseil', 'anders'],
              'Rope type. Use "anders" and fill `anders` for types not in the list.',
            ),
            anders: nullableString('Free-text rope type when `art` is "anders".'),
            laenge_m: nullableInteger(
              'Length of the rope carried, in meters. Recognizable from phrases like "50m-Seil", "2x60m" (then `60`), "Seil 40 Meter". Capture the length per strand only, not the sum.',
            ),
          },
          'Rope information explicitly mentioned in the report.',
        ),

        mobile_absicherung: optionalObject(
          {
            notwendigkeit: z
              .array(
                z.enum([
                  'erforderlich',
                  'empfohlen',
                  'verwendet',
                  'nicht_notwendig',
                  'nicht_empfohlen',
                  'nicht_verwendet',
                ]),
              )
              .optional()
              .describe(
                'All applicable statements about mobile protection — multiple values allowed. ' +
                  '"erforderlich": strictly required; signal words: "muss selber abgesichert werden", "clean", "keine Haken", "Keile zwingend". ' +
                  '"empfohlen": recommended supplement; signal words: "ein paar Friends schaden nicht", "zur Ergaenzung empfohlen". ' +
                  '"verwendet": authors actually placed mobile gear; signal words: "legten wir einen Friend", "Sanduhr gefaedelt". ' +
                  '"nicht_notwendig": explicitly not required; signal words: "komplett eingebohrt, Exen reichen", "kein mobiles Material noetig". ' +
                  '"nicht_empfohlen": explicitly discouraged. ' +
                  '"nicht_verwendet": authors explicitly did not place any mobile gear.',
              ),
            begruendung: nullableString(
              'Why this level of notwendigkeit applies: route condition, bolt spacing, author decision, etc. Present tense.',
            ),
            moeglichkeiten: nullableString(
              'How well and where mobile protection can be placed, e.g. "Gute Rissstrukturen für Friends in der Verschneidung."',
            ),
            friends: z
              .array(friendProtectionItemSchema)
              .optional()
              .describe(
                'Friends/Cams carried or recommended. Aliases: Cam, Cams, Camalot, Camalots, Klemmgeraete, Tricam, Alien. Size specifications such as "0.3–2", "Camalot 0.5" go into `groesse` as a string. "Ein Satz Friends" -> one entry with `groesse: "satz"` and no `anzahl`.',
              ),
            keile: z
              .array(nutProtectionItemSchema)
              .optional()
              .describe(
                'Klemmkeile carried or recommended. Aliases: Keile, Nuts, Rocks, Stopper, Hexentrics. "Satz Keile" -> `groesse: "satz"`.',
              ),
          },
          'Mobile protection requirements, recommendations, and used gear.',
        ),

        schlingen: z
          .array(slingSchema)
          .optional()
          .describe(
            'Slings carried. Length specifications like "120er Schlinge" -> `laenge_cm: 120`. Keep only the fields actually mentioned.',
          ),

        expresskarabiner: optionalObject(
          {
            anzahl: nullableInteger(
              'Number of quickdraws carried or recommended. Aliases: Expressen, Exen, Expressschlingen, Runner. "10 Exen" → `10`. Do not convert vague statements ("einige Exen") → `null`.',
            ),
          },
          'Quickdraw count explicitly mentioned in the report.',
        ),

        zusaetzlich: z
          .array(ausruestungZusaetzlichItemSchema)
          .optional()
          .describe(
            'Other equipment explicitly mentioned in the report that is not captured by the dedicated fields above (seil, mobile_absicherung, schlingen, expresskarabiner). Do not capture clothing, food, or drink.',
          ),
      },
      'Equipment explicitly mentioned for the climbing tour.',
    ),

    zeitbedarf: optionalObject(
      {
        zustieg_min: nullableInteger(
          'Duration of the Zustieg from the starting point (parking lot, transit stop, Huette) to the Einstieg of the route, in minutes. Signal words: "Zustieg", "bis zum Einstieg", "Wandfuss erreicht nach".',
        ),
        reine_kletterzeit_min: nullableInteger(
          'Pure climbing time from the Einstieg to the Ausstieg, in minutes, excluding Zustieg and Abstieg. Signal words: "Kletterzeit", "fuer die Route brauchten wir", "in der Wand". Breaks at the Stand count toward this unless listed separately.',
        ),
        abstieg_min: nullableInteger(
          'Duration of the Abstieg in minutes, measured from the summit or Ausstieg back to the starting point. Rappelling time counts toward the Abstieg if rappelling is the descent route.',
        ),
      },
      'Time requirements normalized to minutes. For ranges, take the mean if the authors own time is not stated; otherwise prefer the time actually taken.',
    ),

    absicherung: optionalObject(
      {
        charakter: nullableEnum(
          ['plaisir', 'sportlich', 'alpin', 'trad'],
          'Overall protection character of the route. ' +
            '"plaisir": bolted throughout, sport-climbing standard. ' +
            '"sportlich": well-bolted but some runouts. ' +
            '"alpin": traditional alpine spacing, some mobile gear expected. ' +
            '"trad": entirely self-protected. ' +
            'Signal words: "Plaisirtour" → plaisir; "alpin abgesichert" → alpin; "clean", "trad" → trad.',
        ),

        hakentypen: z
          .array(
            z.enum([
              'bohrhaken',
              'klebehaken',
              'normalhaken',
              'ringhaken',
              'spreizanker',
              'sanduhr',
              'anders',
            ]),
          )
          .optional()
          .describe(
            'Types of fixed protection present in the route. Collect all that are mentioned. Use "anders" and fill `hakentypen_anders` for types not in the list. ' +
              'bohrhaken: drilled bolt (generic); alias: BH, Bolt, Plaisirhaken. ' +
              'klebehaken: glued/resin anchor; alias: Bühlerhaken, Verbundhaken, Klebeanker. ' +
              'normalhaken: hammered piton; alias: Schlaghaken, Felshaken, Profilhaken, Messerhaken, Fiechtlhaken. ' +
              'ringhaken: piton with a ring; alias: Ring, Abseilring. ' +
              'spreizanker: mechanical expansion bolt; alias: Spit, Expansionshaken, Kronenbohrhaken. ' +
              'sanduhr: natural rock thread; alias: Felsöhr, Sanduhrschlinge.',
          ),
        hakentypen_anders: stringArray(
          'Free-text protection types when "anders" appears in hakentypen.',
        ),

        hakenabstaende: optionalObject(
          {
            bewertung: nullableEnum(
              ['sehr_gut', 'gut', 'mittel', 'schlecht'],
              'Spacing of intermediate Haken between Staende (not the Staende themselves). "plaisirmaessig eng", "Haken wo man sie braucht" → sehr_gut/gut; "teils weite Abstaende" → mittel; "Runouts", "sehr weit", "boese Abstaende" → schlecht.',
            ),
            beschreibung: nullableString(
              'Where spacing is tight or wide, in which Seillaengen runouts occur, whether the crux sections are well protected.',
            ),
          },
          'Spacing of intermediate protection between belay stations.',
        ),

        staende: optionalObject(
          {
            gebohrt: nullableBoolean(
              'Whether the Staende (belay anchors at the end of each Seillaenge) are bolted/fixed. Signal words: "Bohrhakenstaende", "Stand mit zwei Bolts" → true; "Staende selber bauen", "Staende an Koepfln/Sanduhren" → false.',
            ),
            beschreibung: nullableString(
              'Material and condition of the Staende only: bolt type, rings, chains, Abseilringe, whether linked, suitability for rappelling.',
            ),
          },
          'Belay station (Stand) setup and condition — not intermediate Haken.',
        ),

        hakenzustand: optionalObject(
          {
            bewertung: nullableEnum(
              ['gut', 'mittel', 'schlecht'],
              'Condition of existing fixed Haken (both intermediate and at Staende). "neu saniert", "solide Klebehaken" → gut; "teils aeltere Haken" → mittel; "rostig", "fragwuerdig", "Schlaghaken von anno dazumal" → schlecht.',
            ),
            beschreibung: nullableString(
              'Free text about the Haken: type, age, rust, whether the route has been saniert (re-equipped with new hardware).',
            ),
          },
          'Condition of existing fixed protection.',
        ),
      },
      'Protection and fixed-anchor information explicitly mentioned in the report.',
    ),

    schuhwerk: optionalObject(
      {
        zustieg: optionalObject(
          {
            typ: nullableEnum(
              ['bergschuhe', 'zustiegsschuhe', 'turnschuhe', 'wanderschuhe', 'anders'],
              'Footwear for the Zustieg to the Einstieg. Aliases: Approachschuhe → zustiegsschuhe; Bergstiefel/Hochtourenschuhe → bergschuhe. Only fill if the report explicitly addresses Zustieg footwear. Use "anders" and fill the `anders` field for types not in the list.',
            ),
            anders: nullableString('Free-text footwear type when `typ` is "anders".'),
          },
          'Footwear used or recommended for the approach.',
        ),
        klettern: optionalObject(
          {
            typ: nullableEnum(
              [
                'kletterschuhe',
                'bergschuhe',
                'zustiegsschuhe',
                'wanderschuhe',
                'turnschuhe',
                'anders',
              ],
              'Footwear worn or recommended on the climbing route itself. Aliases: Kletterfinken/Finken/Kletterpatschen → kletterschuhe; Approachschuhe → zustiegsschuhe; Bergstiefel / Hochtourenschuhe → bergschuhe. `bergschuhe` or `zustiegsschuhe` occur when the route is easy enough ("alles in Bergschuhen kletterbar"). Use "anders" and fill the `anders` field for types not in the list.',
            ),
            anders: nullableString('Free-text footwear type when `typ` is "anders".'),
          },
          'Footwear used or recommended while climbing the route.',
        ),
        abstieg: optionalObject(
          {
            typ: nullableEnum(
              ['bergschuhe', 'zustiegsschuhe', 'turnschuhe', 'wanderschuhe', 'anders'],
              'Footwear for the Abstieg. Common signal: "Schuhe fuer den Abstieg mitnehmen" or stashing shoes at the Einstieg. Same aliases as Zustieg. Use "anders" and fill the `anders` field for types not in the list.',
            ),
            anders: nullableString('Free-text footwear type when `typ` is "anders".'),
          },
          'Footwear used or recommended for the descent.',
        ),
      },
      'Footwear explicitly mentioned for each part of the tour.',
    ),

    gelaende_und_gefahren: optionalObject(
      {
        charakter: optionalObject(
          {
            exposition: nullableEnum(
              ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'],
              'Compass direction the wall or route faces: `N`, `NO`, `O`, `SO`, `S`, `SW`, `W`, `NW`. Signal words: "Suedwand", "nach Suedosten ausgerichtet". Do not confuse with "ausgesetzt/Ausgesetztheit" — that describes airy exposed climbing, not compass direction.',
            ),
            sonnig: nullableBoolean(
              'Whether a sunny position is explicitly mentioned ("Sonne ab Mittag", "brutheisse Suedwand" → `true`; "schattig", "kommt kaum Sonne hin" → `false`). Do not infer from the Exposition.',
            ),
            schnell_trocknend: nullableBoolean(
              'Whether the rock dries quickly after rain. Signal words: "trocknet schnell", "schon am Vormittag nach Regen kletterbar". Opposite: "bleibt lange nass", "sickert" → `false`.',
            ),
            felsart: nullableEnum(
              [
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
                'amphibolit',
                'diorit',
                'anders',
              ],
              'Rock type of the route, if mentioned. Do not guess from the region. Use "anders" and fill `anders` for rock types not in the list.',
            ),
            anders: nullableString('Free-text rock type when `felsart` is "anders".'),
            beschreibung: nullableString(
              'Free-text summary of the route or wall character: general impression, notable features, atmosphere. Present tense.',
            ),
          },
          'Route or wall character explicitly described in the report.',
        ),

        gefahren: z
          .array(hazardSchema)
          .optional()
          .describe(
            'All hazards explicitly mentioned on the Zustieg, route, or Abstieg. One entry per distinct hazard.',
          ),
      },
      'Terrain character and hazards explicitly mentioned in the report.',
    ),

    klettern: optionalObject(
      {
        schluesselstellen: optionalObject(
          {
            stellen: z
              .array(cruxSchema)
              .optional()
              .describe(
                'Position (`wo`, e.g. "3. Seillaenge", "kurz vor dem Ausstieg") and description of each Schluesselstelle (climbing style, grade, how it feels). Present tense.',
              ),
          },
          'Crux information explicitly mentioned in the report.',
        ),

        schwierigkeit: optionalObject(
          {
            verhaeltnis: nullableEnum(
              ['leichter', 'wie_bewertet', 'schwerer'],
              'Authors\' subjective impression vs. the official grade (UIAA or French from the Topo). "gut machbar fuer den Grad", "weich bewertet" → leichter; "Bewertung passt" → wie_bewertet; "hart fuer 5c", "anspruchsvoller als angegeben" → schwerer.',
            ),
            beschreibung: nullableString(
              'Justification: why it feels harder or easier (e.g. abgespeckt, kraftraubend, technisch, Mut noetig). Present tense.',
            ),
            min_klettererfahrung: nullableString(
              'Recommended minimum climbing experience as free text, e.g. "Sicheres Klettern im 5. Grad im Vorstieg vorausgesetzt". Valuable for departure-recommendation logic.',
            ),
          },
          'Difficulty impression compared with the official or expected grade.',
        ),

        abseilen: optionalObject(
          {
            moeglich: nullableBoolean(
              'Whether Abseilen is mentioned as a descent or retreat option. Signal words: "abseilen ueber die Route", "Abseilstellen eingerichtet".',
            ),
            abseil_max_laenge_m: nullableInteger(
              'Maximum single rappel length in meters. Determines whether a single rope suffices. Signal words: "laengste Abseile 50m", "bis zu 45m abseilen".',
            ),
            zum_einstieg: nullableBoolean(
              'Whether rappelling leads back to the Einstieg. Signal words: "abseilen zum Einstieg", "ueber die Route zurueck zum Wandfuss".',
            ),
            abseilpiste: nullableBoolean(
              'Whether a dedicated Abseilpiste (fixed-anchor rappel line, often separate from the route) exists. Signal words: "Abseilpiste", "eingerichtete Abseilstrecke".',
            ),
            beschreibung: nullableString(
              'How to descend via rappel: which anchors to use, where to find them, any tricky sections. Present tense.',
            ),
          },
          'Rappelling information for descent or retreat.',
        ),

        charakter: optionalObject(
          {
            kletterstil: z
              .array(
                z.enum([
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
                  'rinne',
                  'rampe',
                  'quergang',
                  'schrofen',
                  'couloir',
                  'band',
                  'reibung',
                  'anders',
                ]),
              )
              .optional()
              .describe(
                'Predominant terrain forms of the climbing. Collect all that are mentioned. Use "anders" and list the actual style in the `anders` field. ' +
                  'platte: inclined low-feature slab, friction climbing. ' +
                  'riss: crack: jamming, Piazen; alias: Fingerriss, Handriss, Faustriss, Offwidth. ' +
                  'grat: ridge dropping off on both sides. ' +
                  'kante: steep outer edge, arête. ' +
                  'wand: steep face climbing. ' +
                  'verschneidung: inside corner / dihedral formed by two walls. ' +
                  'ueberhang: leaning beyond vertical. ' +
                  'dach: horizontal overhang, roof. ' +
                  'pfeiler: tower-like protruding pillar. ' +
                  'kamin: chimney: wide crack body fits into; alias: Schlot. ' +
                  'rinne: narrow vertical gully. ' +
                  'rampe: steeply rising ledge ramp. ' +
                  'quergang: horizontal traverse section; alias: Querung, Traverse. ' +
                  'schrofen: mixed rock-and-grass scrambling terrain. ' +
                  'couloir: steep gully, often snow-filled; alias: Gully. ' +
                  'band: horizontal rock ledge; alias: Felsband, Grasband. ' +
                  'reibung: featureless friction slab; alias: Friktion, Smearing.',
              ),
            anders: stringArray('Free-text climbing styles when "anders" appears in kletterstil.'),
            beschreibung: nullableString(
              'Overall climbing character: style, quality, atmosphere, what makes this route memorable. Present tense.',
            ),
            schoenheit: nullableEnum(
              ['uninteressant', 'nett', 'schoen', 'sehr_schoen', 'traumhaft'],
              'Quality of the climbing. Only fill when explicitly mentioned in the report. Signal words: "traumhaft schöner Fels", "absolut empfehlenswert" → traumhaft; "solide Kletterei" → nett/schoen.',
            ),
            ernsthaftigkeit: nullableEnum(
              ['ungefaehrlich', 'ernst', 'sehr_ernst'],
              'Seriousness / commitment of the tour. Only fill when explicitly mentioned. ' +
                '"ernst": notable commitment, limited retreat, some exposure; e.g. long approach, remote location, scarce rescue. ' +
                '"sehr_ernst": no retreat options, highly exposed, prolonged alpine terrain. ' +
                'Signal words: "keine Rückzugsmöglichkeiten", "abschüssig", "lange exponierte alpine Kletterei".',
            ),
            wandhoehe_m: nullableInteger(
              'Height of the wall or route in meters, as explicitly stated in the report (e.g. "300m-Wand", "Wandhöhe 250m"). Do not calculate from pitch lengths.',
            ),
          },
          'Climbing style and terrain character.',
        ),

        routenverlauf: optionalObject(
          {
            routenfindung: nullableEnum(
              ['einfach', 'mittel', 'schwierig'],
              'How difficult it is to identify the line of the route. "logische Linie", "Haken immer sichtbar" → einfach; "etwas Spuersinn noetig" → mittel; "Verhauer-Gefahr", "Topo zwingend", "lange gesucht" → schwierig.',
            ),
            beschreibung: nullableString(
              'The line and orientation: prominent features, where Verhauer risk is high, what to orient by. Present tense.',
            ),
            rueckzug_moeglich: nullableBoolean(
              'Whether Rueckzug or escape options are mentioned, e.g. rappelling from every Stand, traversing into easier terrain, exiting onto a Band.',
            ),
            rueckzug_beschreibung: nullableString(
              'Where and how a Rueckzug is possible, as a self-contained present-tense sentence.',
            ),
            einstiegshoehe_m: nullableInteger(
              'Elevation of the Einstieg (start of the climbing route) in meters, as stated in the report or derived from waypoint names.',
            ),
          },
          'Route line, orientation, and retreat information.',
        ),

        seillaengen_info: optionalObject(
          {
            anzahl_total: nullableInteger(
              'Total number of pitches (Seillaengen) of the route. Signal words: "8 SL", "10 Laengen", "in 6 Seillängen".',
            ),
            verbinden: optionalObject(
              {
                moeglich: nullableBoolean(
                  'Whether Seillaengen can be linked to skip belays. Signal words: "SL 3 und 4 verbinden", "mit 60m-Seil zusammenhaengbar".',
                ),
                beschreibung: nullableString(
                  'Which Seillaengen can be linked and under what conditions (rope length, rope drag, gear).',
                ),
              },
              'Information about linking pitches.',
            ),
            seillaengen: z
              .array(pitchSchema)
              .optional()
              .describe(
                'Structured description of individual Seillaengen if the report covers them one by one. `nummer`: 1 = first pitch; `schwierigkeit`: grade as given in the report (e.g. "5c", "VI-", "4a"); `anzahl_bohrhaken`: fixed Bohrhaken count; `laenge_m`: length in meters; `beschreibung`: character, crux, remarks. Present tense.',
              ),
          },
          'Pitch count, linkable pitches, and individual pitch details.',
        ),
      },
      'Climbing-specific route details explicitly mentioned in the report.',
    ),

    anreise: optionalObject(
      {
        parkplatz: optionalObject(
          {
            ort: nullableString(
              'Name or location of the parking spot (e.g. "Parkplatz Saentisbahn", "Kehrplatz am Strassenende").',
            ),
            kosten: nullableString(
              'Costs or fee info as free text ("5 CHF/Tag", "Parkuhr", "gratis"). Also capture mere mention that fees apply.',
            ),
            besonderheiten: nullableString(
              'Practical notes: few spots, fills up early, tight, driving ban beyond a point, private road, key pickup.',
            ),
          },
          'Parking information.',
        ),

        oev: optionalObject(
          {
            verkehrsmittel: z
              .array(verkehrsmittelItemSchema)
              .optional()
              .describe(
                'All public transport modes explicitly mentioned for the approach or descent.',
              ),
            endstation: nullableString(
              'Stop or station where one gets off (e.g. "Wasserauen", "Steingletscher, Hotel").',
            ),
            luftseilbahn_moeglich: nullableBoolean(
              'Whether any cable car (Luftseilbahn, Gondel, Seilbahn) can be used for approach or descent — even if the authors did not use it.',
            ),
            anmeldung_noetig: nullableBoolean(
              'Whether registration or reservation is required for a transport mode. Signal words: "telefonisch anmelden", "Reservation erforderlich".',
            ),
          },
          'Public transport information.',
        ),

        von_passhoehe_aus: nullableString(
          'Pass name if the tour starts from a pass elevation (e.g. "Grimselpass", "Furkapass"). Only fill when explicitly mentioned.',
        ),
      },
      'Arrival and access information explicitly mentioned in the report.',
    ),

    zustieg_und_abstieg: optionalObject(
      {
        zustieg: optionalObject(
          {
            einstiegsfindung: nullableEnum(
              ['einfach', 'mittel', 'schwer'],
              'How easy it is to find the Einstieg. "nicht zu verfehlen", "beschriftet", "Steinmann markiert" → einfach; "etwas suchen" → mittel; "lange gesucht", "ohne GPS kaum zu finden" → schwer.',
            ),
            beschreibung: nullableString(
              'Where the Einstieg is and how to recognize it: directions, markings (Steinmaenner, route name on rock, first Bohrhaken), prominent features. Present tense.',
            ),
            schwierigkeit: nullableString(
              'Technical or alpine difficulty of the Zustieg as free text: hiking scale (e.g. "T3"), scrambling sections, snowfields, scree, fixed cables, exposed passages.',
            ),
            hm_aufstieg: nullableInteger(
              'Elevation gain on the Zustieg in meters, as explicitly stated in the report.',
            ),
            hm_abstieg: nullableInteger(
              'Elevation loss on the Zustieg in meters (e.g. if the approach descends before the Einstieg), as explicitly stated.',
            ),
          },
          'Approach to the route start.',
        ),

        abstieg: optionalObject(
          {
            fuehrt_zum_einstieg: nullableBoolean(
              'Whether the Abstieg passes the Einstieg again — relevant for gear stashed there. Signal words: "zurueck zum Einstieg", "Rucksackdepot wird wieder passiert".',
            ),
            schwierigkeit: nullableString(
              'Difficulty and challenges of the Abstieg as free text: hiking scale, downclimbing sections, scree, old snowfields, orientation, rappel sections (unless captured under `klettern.abseilen`).',
            ),
            hm_aufstieg: nullableInteger(
              'Elevation gain on the Abstieg in meters (e.g. if the descent goes up before coming down), as explicitly stated.',
            ),
            hm_abstieg: nullableInteger(
              'Elevation loss on the Abstieg in meters, as explicitly stated.',
            ),
          },
          'Descent from the summit or route exit.',
        ),

        verpflegung_typ: nullableEnum(
          [
            'huette',
            'berggasthaus',
            'bergrestaurant',
            'alpwirtschaft',
            'restaurant',
            'beizli',
            'kiosk',
            'anders',
          ],
          'Type of food/drink option passed on the Zustieg or Abstieg. Aliases: SAC-Huette/Berghütte/Schutzhütte/Capanna → huette; Berggasthof → berggasthaus; Alpbeiz/Alpwirtschaft → alpwirtschaft; Beiz/Beizli → beizli. Use "anders" when the type is not in the list.',
        ),
      },
      'Approach and descent details explicitly mentioned in the report.',
    ),

    besonderes: optionalObject(
      {
        saisonalitaet: optionalObject(
          {
            geeignet: z
              .array(
                z.enum([
                  'fruehling',
                  'fruehsommer',
                  'sommer',
                  'hochsommer',
                  'spaetsommer',
                  'herbst',
                  'winter',
                  'ganzjaehrig',
                ]),
              )
              .optional()
              .describe(
                'Seasons explicitly described as suitable for the route. Signal words: "ideal im Herbst", "Sommertour", "ganzjährig begehbar".',
              ),
          },
          'Seasonality information explicitly mentioned in the report.',
        ),

        frequentierung: nullableEnum(
          ['einsam', 'wenig_begangen', 'normal', 'beliebt', 'sehr_beliebt'],
          'How busy the route is. Only fill when explicitly mentioned. ' +
            'Signal words: "Wir waren die einzige Seilschaft" → einsam; "wenig begangen", "selten besucht" → wenig_begangen; "Wartezeiten an den Ständen", "Klassiker mit viel Betrieb" → sehr_beliebt.',
        ),

        bedingungen: optionalObject(
          {
            fels_zustand: nullableEnum(
              ['trocken', 'feucht', 'nass'],
              'Rock condition on the tour day. Signal words: "Fels trocken", "nach dem Regen noch feucht", "nasse Platten".',
            ),
            altschnee_auf_zustieg: nullableBoolean(
              'Whether old snow or névé was present on the approach on tour day. Signal words: "Altschnee auf dem Zustieg", "Firnfeld noch vorhanden".',
            ),
            beschreibung: nullableString(
              'Tour-day conditions: temperature, weather, overall state of the mountain.',
            ),
          },
          'Tour-day conditions — ephemeral but useful for interpreting other fields and for ML training on seasonal patterns.',
        ),

        hinweise: stringArray(
          'Other relevant notes that fit no other category: crag closures (bird protection), gear stashes, mobile reception, water sources, Huette reservations, Topo sources, warnings to other parties.',
        ),
      },
      'Additional notes that do not fit another category.',
    ),
  })
  .strict()
  .describe(climbingExtractionSchemaDescription);

export type ClimbingExtractionAgentResult = z.infer<typeof climbingExtractionAgentResultSchema>;

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
