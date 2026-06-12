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

const integerArray = (description: string) =>
  z.array(z.number().int()).optional().describe(description);

const friendProtectionItemSchema = z
  .object({
    groesse: z.string().nullable(),
    anzahl: z.number().int().nullable(),
  })
  .strict();

const nutProtectionItemSchema = z
  .object({
    groesse: z.string().nullable(),
    anzahl: z.number().int().nullable(),
  })
  .strict();

const slingSchema = z
  .object({
    typ: z.string().nullable(),
    laenge_cm: z.number().int().nullable(),
    anzahl: z.number().int().nullable(),
  })
  .strict();

const hazardSchema = z
  .object({
    typ: z.string(),
    beschreibung: z.string().nullable(),
  })
  .strict();

const cruxSchema = z
  .object({
    wo: z.string().nullable(),
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
              ['halbseil', 'zwillingsseil', 'einfachseil'],
              'Type of rope carried. `einfachseil`: single strand, often written as "50er Seil" or simply "Seil" without qualifier — in that case `null`, unless the type is clearly named. `halbseil`: two strands (8–9 mm), strands may be clipped individually; signal words: "Halbseile", "Doppelseil 2x50m". `zwillingsseil`: thin double rope (~7.5–8 mm), only used as a double strand; signal word: "Zwillingsseile".',
            ),
            laenge_m: nullableInteger(
              'Length of the rope carried, in meters. Recognizable from phrases like "50m-Seil", "2x60m" (then `60`), "Seil 40 Meter". Capture the length per strand only, not the sum.',
            ),
          },
          'Rope information explicitly mentioned in the report.',
        ),
        mobile_absicherung: optionalObject(
          {
            erforderlich: nullableBoolean(
              'Whether mobile protection (Friends/Cams, Keile/Nuts, slings) is strictly required because the route is not, or only partially, equipped with fixed Haken. Signal words: "muss selber abgesichert werden", "clean", "keine Haken", "Keile zwingend". Only `false` if the report explicitly states that no mobile gear is needed (e.g. "komplett eingebohrt, Exen reichen").',
            ),
            empfohlen: nullableBoolean(
              'Whether mobile protection is recommended as a useful supplement even though the route is fundamentally equipped (e.g. bolted). Signal words: "ein paar Friends schaden nicht", "Camalots zur Ergaenzung empfohlen", "wer mag, nimmt Keile mit".',
            ),
            verwendet: nullableBoolean(
              'Whether the authors actually placed mobile protection during the climb (placed Friends/Keile, slung Schlingen over spikes, or threaded Sanduhren). Signal words: "legten wir einen Friend", "Sanduhr gefaedelt", "Koepflschlinge gelegt".',
            ),
            moeglichkeiten: nullableString(
              'Free text: how well, how often, and where mobile protection can be placed. Examples from reports: "gute Rissstrukturen fuer Friends", "kaum Placements", "Sanduhren vorhanden". Briefly preserve the original wording.',
            ),
            friends: z
              .array(friendProtectionItemSchema)
              .optional()
              .describe(
                'Friends/Cams carried or recommended (camming devices with movable segments). Size specifications such as "0.3–2", "Camalot 0.5" go into `groesse` as a string. "Ein Satz Friends" (a full set) → one entry with `groesse: "satz"`, `anzahl: null`.',
              ),
            keile: z
              .array(nutProtectionItemSchema)
              .optional()
              .describe(
                'Klemmkeile carried or recommended. Synonyms in reports: Keile, Nuts, Rocks, Stopper, Hexentrics. Same logic as for Friends ("Satz Keile" → `groesse: "satz"`).',
              ),
          },
          'Mobile protection requirements, recommendations, and used gear.',
        ),
        schlingen: z
          .array(slingSchema)
          .optional()
          .describe(
            'Slings carried. `typ` e.g. "bandschlinge", "zackenschlinge" (also called Koepflschlinge), "sanduhrschlinge", "reepschnur", "kevlarschlinge". Length specifications like "120er Schlinge" → `laenge_cm: 120`.',
          ),
        expresskarabiner: optionalObject(
          {
            anzahl: nullableInteger(
              'Number of quickdraws carried or recommended. Synonyms: Expressen, Exen, Expressschlingen, Runner. "10 Exen" → `10`. Do not convert vague statements ("einige Exen") into a number → `null`.',
            ),
          },
          'Quickdraw information explicitly mentioned in the report.',
        ),
        zusaetzlich: stringArray(
          'Other explicitly mentioned equipment that fits no other field: e.g. helmet, Pickel (ice axe), Steigeisen (crampons), headlamp, Abseilgeraet (rappel device), Prusikschlinge, bivy sack. Do not capture clothing or food.',
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
        hakenabstaende: optionalObject(
          {
            bewertung: nullableEnum(
              ['sehr_gut', 'gut', 'mittel', 'schlecht'],
              'Assessment of the spacing between fixed intermediate protection points (Haken). Only fill in if Haken are present or mentioned. Mapping: "plaisirmaessig eng", "Haken wo man sie braucht" → `sehr_gut`/`gut`; "teils weite Abstaende", "alpin abgesichert" → `mittel`; "Runouts", "sehr weit", "boese Abstaende" → `schlecht`.',
            ),
            beschreibung: nullableString(
              'Free-text justification regarding the Hakenabstaende: where the spacing is tight or wide, in which Seillaengen runouts occur, whether the hard sections are well protected.',
            ),
          },
          'Spacing of bolts or fixed pitons where they are mentioned.',
        ),
        staende: optionalObject(
          {
            gebohrt: nullableBoolean(
              'Whether the Standplaetze (belay anchors between Seillaengen) are bolted or fixed in place. Signal words: "Bohrhakenstaende", "Staende eingerichtet", "Stand mit zwei Bolts". `false` for "Staende selber bauen", "Staende an Koepfln/Sanduhren".',
            ),
            beschreibung: nullableString(
              'Details about the Standplaetze: material (Bolts, Normalhaken, chains, rappel rings), condition, reliability, whether linked, whether suitable for rappelling.',
            ),
          },
          'Belay station setup and condition.',
        ),
        hakenzustand: optionalObject(
          {
            bewertung: nullableEnum(
              ['gut', 'mittel', 'schlecht'],
              'Condition of the existing fixed Haken. "neu saniert", "solide Klebehaken" → `gut`; "teils aeltere Haken" → `mittel`; "rostig", "fragwuerdig", "Schlaghaken von anno dazumal" → `schlecht`.',
            ),
            beschreibung: nullableString(
              'Free text about the Haken: type (Bohrhaken/Bolts, Klebehaken, Normalhaken/Schlaghaken), age, rust, whether the route has been saniert (re-equipped).',
            ),
          },
          'Condition of existing bolts or fixed pitons.',
        ),
      },
      'Protection and fixed-anchor information explicitly mentioned in the report.',
    ),
    schuhwerk: optionalObject(
      {
        zustieg: optionalObject(
          {
            typ: nullableEnum(
              ['bergschuhe', 'zustiegsschuhe', 'turnschuhe'],
              'Which footwear is mentioned or recommended for the Zustieg to the Einstieg. Only fill in if the report explicitly addresses the Zustieg ("Turnschuhe reichen fuer den Zustieg").',
            ),
          },
          'Footwear used or recommended for the approach.',
        ),
        klettern: optionalObject(
          {
            typ: nullableEnum(
              ['kletterschuhe', 'bergschuhe', 'zustiegsschuhe'],
              'Which footwear is worn or recommended on the climbing route itself. `bergschuhe`/`zustiegsschuhe` occur when the route is easy enough ("alles in Bergschuhen kletterbar").',
            ),
          },
          'Footwear used or recommended while climbing the route.',
        ),
        abstieg: optionalObject(
          {
            typ: nullableEnum(
              ['bergschuhe', 'zustiegsschuhe', 'turnschuhe'],
              'Which footwear is mentioned for the Abstieg. Common signal: "Schuhe fuer den Abstieg mitnehmen" or stashing shoes at the Einstieg.',
            ),
          },
          'Footwear used or recommended for the descent.',
        ),
      },
      'Footwear explicitly mentioned for each part of the tour. Footwear types are bergschuhe, zustiegsschuhe, turnschuhe, and kletterschuhe.',
    ),
    gelaende_und_gefahren: optionalObject(
      {
        charakter: optionalObject(
          {
            exposition: nullableString(
              'Compass direction the wall or route faces, as an abbreviation: `N`, `NO`, `O`, `SO`, `S`, `SW`, `W`, `NW`. Signal words: "Suedwand", "nach Suedosten ausgerichtet". Caution: do not confuse with "ausgesetzt/Ausgesetztheit" — that describes airy, exposed climbing, not the compass direction.',
            ),
            sonnig: nullableBoolean(
              'Whether a sunny position is explicitly mentioned ("Sonne ab Mittag", "brutheisse Suedwand" → `true`; "schattig", "kommt kaum Sonne hin" → `false`). Do not infer from the Exposition.',
            ),
            schnell_trocknend: nullableBoolean(
              'Whether the rock dries quickly after rain or wetness. Signal words: "trocknet schnell", "schon am Vormittag nach Regen kletterbar"; opposite: "bleibt lange nass", "sickert" → `false`.',
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
              ],
              'Rock type of the route, if mentioned. Map cues like "rauer Granit", "loechriger Kalk", "Nagelfluh" directly. Do not guess from the region.',
            ),
          },
          'Route or wall character explicitly described in the report.',
        ),
        gefahren: z
          .array(hazardSchema)
          .optional()
          .describe(
            'All hazards mentioned on the Zustieg, route, or Abstieg. Typical `typ` values: "bruechiger_fels" (loose blocks, "Vorsicht mit dem Seil"), "steinschlag" (rockfall, also caused by other parties), "gras" (grassy sections), "naesse", "verhauer" (risk of going off-route), "absturzgelaende", "wechten" (cornices), "spalten" (crevasses). `beschreibung` states location and context.',
          ),
      },
      'Terrain character and hazards explicitly mentioned in the report.',
    ),
    klettern: optionalObject(
      {
        schluesselstellen: optionalObject(
          {
            vorhanden: nullableBoolean(
              'Whether at least one Schluesselstelle is mentioned. The Schluesselstelle (also "Crux") is the most difficult spot or passage of the route; the "Schluessellaenge" is the most difficult Seillaenge. Both count.',
            ),
            stellen: z
              .array(cruxSchema)
              .optional()
              .describe(
                'Position (`wo`, e.g. "3. Seillaenge", "kurz vor dem Ausstieg") and description of each Schluesselstelle (style of climbing, grade, how it feels).',
              ),
          },
          'Crux information explicitly mentioned in the report.',
        ),
        schwierigkeit: optionalObject(
          {
            verhaeltnis: nullableEnum(
              ['leichter', 'wie_bewertet', 'schwerer'],
              'The authors\' subjective impression compared to the official grade (e.g. UIAA or French grade from the guidebook/Topo). "gut machbar fuer den Grad", "weich bewertet" → `leichter`; "Bewertung passt" → `wie_bewertet`; "hart fuer 5c", "anspruchsvoller als angegeben" → `schwerer`.',
            ),
            beschreibung: nullableString(
              'Justification of the difficulty impression: why it felt harder or easier (e.g. abgespeckt — polished rock, boldness required, pumpy, technical).',
            ),
          },
          'Difficulty impression compared with the official or expected grade.',
        ),
        abseilen: optionalObject(
          {
            moeglich: nullableBoolean(
              'Whether Abseilen (rappelling on a rope threaded through a fixed anchor) is mentioned as a descent or retreat option. Signal words: "abseilen ueber die Route", "Abseilstellen eingerichtet".',
            ),
            anzahl: nullableInteger(
              'Number of required or described rappels (maneuvers from Stand to Stand). "4x abseilen", "in 5 Abseilern" → the corresponding number.',
            ),
            laengen_m: integerArray(
              'Individual rappel lengths in meters, if mentioned ("abseilen 25m, dann 50m" → `[25, 50]`). Important for determining whether an Einfachseil suffices.',
            ),
            zum_einstieg: nullableBoolean(
              'Whether rappelling leads directly back to the Einstieg (convenient for stashed gear). Signal words: "abseilen zum Einstieg", "ueber die Route zurueck zum Wandfuss".',
            ),
            abseilpiste: nullableBoolean(
              'Whether an Abseilpiste exists: a dedicated rappel line equipped with fixed anchors, often separate from the route. Signal words: "Abseilpiste", "eingerichtete Abseilstrecke".',
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
                ]),
              )
              .optional()
              .describe(
                'Predominant terrain forms of the climbing. `platte`: inclined, low-feature slab (also friction climbing); `riss`: narrow crack (jamming, Piazen/laybacking); `grat`: ridge dropping off on both sides; `kante`: steep, ridge-like outer edge (arête); `wand`: steep face climbing; `verschneidung`: inside corner formed by two walls (dihedral); `ueberhang`: leaning beyond vertical; `dach`: horizontal overhang (roof); `pfeiler`: tower-like protruding structure (pillar); `kamin`: wide crack the whole body fits into (chimney; Stemm-/Spreiztechnik). Collect all styles mentioned.',
              ),
          },
          'Climbing style and movement character.',
        ),
        routenverlauf: optionalObject(
          {
            routenfindung: nullableEnum(
              ['einfach', 'mittel', 'schwierig'],
              'How difficult it is to identify the line of the route. "logische Linie", "Haken immer sichtbar" → `einfach`; "etwas Spuersinn noetig" → `mittel`; "Verhauer-Gefahr", "Topo zwingend", "lange gesucht" → `schwierig`.',
            ),
            beschreibung: nullableString(
              'Free text about the line and orientation: prominent features, where Verhauer (unintentionally going off-route) is a risk, what to orient by.',
            ),
            rueckzug_moeglich: nullableBoolean(
              'Whether Rueckzug (bailing on the tour) or escape options from the route are mentioned, e.g. rappelling from every Stand, traversing into easier terrain, exiting onto a Band (ledge).',
            ),
            rueckzug_beschreibung: nullableString(
              'Where and how a Rueckzug is possible (e.g. "bis zur 4. SL von jedem Stand abseilbar", "ab dem Band Ausstieg nach links").',
            ),
          },
          'Route line, orientation, and retreat information.',
        ),
        seillaengen_verbinden: optionalObject(
          {
            moeglich: nullableBoolean(
              'Whether Seillaengen (pitches between two Standplaetze) can be linked to skip belays. Signal words: "SL 3 und 4 verbinden", "mit 60m-Seil zusammenhaengbar".',
            ),
            beschreibung: nullableString(
              'Which Seillaengen can be linked and under what conditions (rope length in meters, rope drag, gear requirements).',
            ),
          },
          'Information about linking pitches.',
        ),
        seillaengen: z
          .array(pitchSchema)
          .optional()
          .describe(
            'Structured description of individual Seillaengen, if the report covers them one by one. `nummer`: position in the route (1 = first SL); `schwierigkeit`: grade as a string, as given in the report (e.g. "5c", "VI-", "4a"); `anzahl_bohrhaken`: number of fixed Bohrhaken in that pitch; `laenge_m`: length in meters; `beschreibung`: character, key spots, remarks.',
          ),
      },
      'Climbing-specific route details explicitly mentioned in the report.',
    ),
    anreise: optionalObject(
      {
        parkplatz: optionalObject(
          {
            ort: nullableString(
              'Name or location description of the parking lot or parking option (e.g. "Parkplatz Saentisbahn", "Kehrplatz am Strassenende", "Weiler Hinterberg").',
            ),
            kosten: nullableString(
              'Costs or fee information as free text ("5 CHF/Tag", "Parkuhr", "gratis"). Also capture mere mentions that fees apply.',
            ),
            besonderheiten: nullableString(
              'Practical parking notes: few spots, fills up early, tight, driving ban beyond a certain point, key pickup required, private road.',
            ),
          },
          'Parking information.',
        ),
        oev: optionalObject(
          {
            verkehrsmittel: stringArray(
              'All mentioned public transport modes for getting there: e.g. "zug", "bus", "postauto", "rufbus", "luftseilbahn", "schiff". Collect in lowercase.',
            ),
            endstation: nullableString(
              'Name of the stop or station where one gets off for the start of the tour (e.g. "Wasserauen", "Steingletscher, Hotel").',
            ),
            luftseilbahn_moeglich: nullableBoolean(
              'Whether a Luftseilbahn (cable car, also Gondel, Seilbahn) can be used for the approach or descent. Also capture if the authors merely mention it without using it.',
            ),
            anmeldung_noetig: nullableBoolean(
              'Whether registration or a reservation is required for a transport mode (typical for Rufbusse and small cable cars). Signal words: "telefonisch anmelden", "Reservation erforderlich".',
            ),
          },
          'Public transport information.',
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
              'How easy it is to find the Einstieg of the route. "nicht zu verfehlen", "beschriftet", "Steinmann markiert" → `einfach`; "etwas suchen" → `mittel`; "lange gesucht", "ohne GPS kaum zu finden" → `schwer`.',
            ),
            beschreibung: nullableString(
              'Where the Einstieg is located and how to recognize it: directions, markings (Steinmaenner/cairns, route name on the rock, first Bohrhaken visible), prominent features.',
            ),
            schwierigkeit: nullableString(
              'Technical or alpine difficulty of the Zustieg as free text: hiking scale (e.g. "T3"), scrambling sections, snowfields, scree, fixed cables, exposed passages.',
            ),
          },
          'Approach to the route start.',
        ),
        abstieg: optionalObject(
          {
            fuehrt_zum_einstieg: nullableBoolean(
              'Whether the Abstieg passes the Einstieg again. Relevant for gear stashed at the Einstieg ("Schuhdepot"). Signal words: "zurueck zum Einstieg", "Rucksackdepot wird wieder passiert".',
            ),
            verpflegung_moeglich: nullableBoolean(
              'Whether the Abstieg passes a place offering food or drink: Huette (SAC-Huette, Berggasthaus), restaurant, Alpwirtschaft, kiosk.',
            ),
            verpflegung_beschreibung: nullableString(
              'Name or location of the food option (e.g. "Berggasthaus Aescher", "Doldenhornhuette").',
            ),
            schwierigkeit: nullableString(
              'Difficulty and concrete challenges of the Abstieg as free text: hiking scale, downclimbing sections, scree, old snowfields, orientation, rappel sections (unless captured structurally under `klettern.abseilen`).',
            ),
          },
          'Descent from the summit or route exit.',
        ),
      },
      'Approach and descent details explicitly mentioned in the report.',
    ),
    besonderes: optionalObject(
      {
        saisonalitaet: nullableString(
          'Notes on particularly suitable or unsuitable seasons and conditions: e.g. "Fruehling wegen Naesse meiden", "ideal im Herbst", "im Hochsommer zu heiss", "Altschnee bis Juni im Zustieg", "nach Regen 2 Tage warten".',
        ),
        hinweise: stringArray(
          'Other relevant notes that fit no other category: e.g. crag closures (bird protection), gear stashes, mobile reception, water sources, Huette reservations, Topo sources, warnings to other parties.',
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
