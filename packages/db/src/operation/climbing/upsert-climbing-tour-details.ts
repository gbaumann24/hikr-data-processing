import { Prisma, type PrismaClient } from '../../../generated/client';
import type { ClimbingTourDetailsSchemaWriteInput } from '../types';
import { computeClimbingTourCompleteness } from './climbing-tour-completeness';

type ClimbingTourDetailsTransaction = Prisma.TransactionClient;

// Persists the structured extraction details for an existing climbing tour base row.
export async function upsertClimbingTourDetails(
  prisma: PrismaClient,
  input: ClimbingTourDetailsSchemaWriteInput,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await assertClimbingTourBaseExists(tx, input.reportId);
    await persistZusammenfassung(tx, input);
    await persistAusruestung(tx, input);
    await persistZeitbedarf(tx, input);
    await persistAbsicherung(tx, input);
    await persistSchuhwerk(tx, input);
    await persistGelaendeUndGefahren(tx, input);
    await persistKlettern(tx, input);
    await persistAnreise(tx, input);
    await persistZustiegUndAbstieg(tx, input);
    await persistStuetzpunkt(tx, input);
    await persistQuellen(tx, input);
    await persistBerichtsqualitaet(tx, input);
    await persistBesonderes(tx, input);
  });
}

// Ensures detail writes have the required climbing tour parent row.
async function assertClimbingTourBaseExists(
  tx: ClimbingTourDetailsTransaction,
  reportId: bigint,
): Promise<void> {
  const base = await tx.climbingTourBaseSchema.findUnique({
    where: { reportId },
    select: { reportId: true },
  });

  if (!base) {
    throw new Error(
      `Cannot persist climbing tour details for report ${reportId.toString()} without a climbing tour base row`,
    );
  }
}

// Writes the one-sentence extraction summary onto the climbing tour base row.
async function persistZusammenfassung(
  tx: ClimbingTourDetailsTransaction,
  input: ClimbingTourDetailsSchemaWriteInput,
): Promise<void> {
  await tx.climbingTourBaseSchema.update({
    where: { reportId: input.reportId },
    data: { zusammenfassung: nullable(input.zusammenfassung) },
  });
}

// Writes or clears equipment extraction details for the report.
async function persistAusruestung(
  tx: ClimbingTourDetailsTransaction,
  input: ClimbingTourDetailsSchemaWriteInput,
): Promise<void> {
  const details = input.ausruestung;

  if (!details) {
    await tx.climbingTourAusruestungSchema.deleteMany({ where: { baseId: input.reportId } });
    return;
  }

  const data = {
    seilArt: nullable(details.seil?.art),
    seilAnders: nullable(details.seil?.anders),
    seilLaengeM: nullable(details.seil?.laenge_m),
    mobileAbsicherungNotwendigkeit: jsonArray(details.mobile_absicherung?.notwendigkeit),
    mobileAbsicherungBegruendung: nullable(details.mobile_absicherung?.begruendung),
    mobileAbsicherungMoeglichkeiten: nullable(details.mobile_absicherung?.moeglichkeiten),
    mobileAbsicherungFriends: jsonArray(details.mobile_absicherung?.friends),
    mobileAbsicherungKeile: jsonArray(details.mobile_absicherung?.keile),
    schlingen: jsonArray(details.schlingen),
    expresskarabinerAnzahl: nullable(details.expresskarabiner?.anzahl),
    zusaetzlich: jsonArray(details.zusaetzlich),
  };

  await tx.climbingTourAusruestungSchema.upsert({
    where: { baseId: input.reportId },
    create: { baseId: input.reportId, ...data },
    update: data,
  });
}

// Writes or clears time requirement extraction details for the report.
async function persistZeitbedarf(
  tx: ClimbingTourDetailsTransaction,
  input: ClimbingTourDetailsSchemaWriteInput,
): Promise<void> {
  const details = input.zeitbedarf;

  if (!details) {
    await tx.climbingTourZeitbedarfSchema.deleteMany({ where: { baseId: input.reportId } });
    return;
  }

  const data = {
    zustiegMin: nullable(details.zustieg_min),
    reineKletterzeitMin: nullable(details.reine_kletterzeit_min),
    abstiegMin: nullable(details.abstieg_min),
  };

  await tx.climbingTourZeitbedarfSchema.upsert({
    where: { baseId: input.reportId },
    create: { baseId: input.reportId, ...data },
    update: data,
  });
}

// Writes or clears protection extraction details for the report.
async function persistAbsicherung(
  tx: ClimbingTourDetailsTransaction,
  input: ClimbingTourDetailsSchemaWriteInput,
): Promise<void> {
  const details = input.absicherung;

  if (!details) {
    await tx.climbingTourAbsicherungSchema.deleteMany({ where: { baseId: input.reportId } });
    return;
  }

  const data = {
    charakter: nullable(details.charakter),
    hakentypen: jsonArray(details.hakentypen),
    hakentypenAnders: jsonArray(details.hakentypen_anders),
    hakenabstaendeBewertung: nullable(details.hakenabstaende?.bewertung),
    hakenabstaendeBeschreibung: nullable(details.hakenabstaende?.beschreibung),
    staendeGebohrt: nullable(details.staende?.gebohrt),
    staendeBeschreibung: nullable(details.staende?.beschreibung),
    hakenzustandBewertung: nullable(details.hakenzustand?.bewertung),
    hakenzustandBeschreibung: nullable(details.hakenzustand?.beschreibung),
  };

  await tx.climbingTourAbsicherungSchema.upsert({
    where: { baseId: input.reportId },
    create: { baseId: input.reportId, ...data },
    update: data,
  });
}

// Writes or clears footwear extraction details for the report.
async function persistSchuhwerk(
  tx: ClimbingTourDetailsTransaction,
  input: ClimbingTourDetailsSchemaWriteInput,
): Promise<void> {
  const details = input.schuhwerk;

  if (!details) {
    await tx.climbingTourSchuhwerkSchema.deleteMany({ where: { baseId: input.reportId } });
    return;
  }

  const data = {
    zustiegTyp: nullable(details.zustieg?.typ),
    zustiegAnders: nullable(details.zustieg?.anders),
    kletternTyp: nullable(details.klettern?.typ),
    kletternAnders: nullable(details.klettern?.anders),
    abstiegTyp: nullable(details.abstieg?.typ),
    abstiegAnders: nullable(details.abstieg?.anders),
  };

  await tx.climbingTourSchuhwerkSchema.upsert({
    where: { baseId: input.reportId },
    create: { baseId: input.reportId, ...data },
    update: data,
  });
}

// Writes or clears terrain and hazard extraction details for the report.
async function persistGelaendeUndGefahren(
  tx: ClimbingTourDetailsTransaction,
  input: ClimbingTourDetailsSchemaWriteInput,
): Promise<void> {
  const details = input.gelaende_und_gefahren;

  if (!details) {
    await tx.climbingTourGelaendeUndGefahrenSchema.deleteMany({
      where: { baseId: input.reportId },
    });
    return;
  }

  const data = {
    charakterExposition: nullable(details.charakter?.exposition),
    charakterSonnig: nullable(details.charakter?.sonnig),
    charakterSchnellTrocknend: nullable(details.charakter?.schnell_trocknend),
    charakterFelsart: nullable(details.charakter?.felsart),
    charakterAnders: nullable(details.charakter?.anders),
    charakterBeschreibung: nullable(details.charakter?.beschreibung),
    gefahren: jsonArray(details.gefahren),
    felsqualitaet: jsonArray(details.felsqualitaet),
    felsqualitaetAnders: jsonArray(details.felsqualitaet_anders),
  };

  await tx.climbingTourGelaendeUndGefahrenSchema.upsert({
    where: { baseId: input.reportId },
    create: { baseId: input.reportId, ...data },
    update: data,
  });
}

// Writes or clears climbing-route extraction details for the report.
async function persistKlettern(
  tx: ClimbingTourDetailsTransaction,
  input: ClimbingTourDetailsSchemaWriteInput,
): Promise<void> {
  const details = input.klettern;

  if (!details) {
    await tx.climbingTourKletternSchema.deleteMany({ where: { baseId: input.reportId } });
    return;
  }

  const data = {
    schluesselstellenStellen: jsonArray(details.schluesselstellen?.stellen),
    schwierigkeitVerhaeltnis: nullable(details.schwierigkeit?.verhaeltnis),
    schwierigkeitBeschreibung: nullable(details.schwierigkeit?.beschreibung),
    schwierigkeitMinKlettererfahrung: nullable(details.schwierigkeit?.min_klettererfahrung),
    abseilenMoeglich: nullable(details.abseilen?.moeglich),
    abseilenMaxLaengeM: nullable(details.abseilen?.abseil_max_laenge_m),
    abseilenZumEinstieg: nullable(details.abseilen?.zum_einstieg),
    abseilenAbseilpiste: nullable(details.abseilen?.abseilpiste),
    abseilenBeschreibung: nullable(details.abseilen?.beschreibung),
    charakterKletterstil: jsonArray(details.charakter?.kletterstil),
    charakterAnders: jsonArray(details.charakter?.anders),
    charakterBeschreibung: nullable(details.charakter?.beschreibung),
    charakterSchoenheit: nullable(details.charakter?.schoenheit),
    charakterErnsthaftigkeit: nullable(details.charakter?.ernsthaftigkeit),
    charakterWandhoehe: nullable(details.charakter?.wandhoehe_m),
    routenverlaufRoutenfindung: nullable(details.routenverlauf?.routenfindung),
    routenverlaufBeschreibung: nullable(details.routenverlauf?.beschreibung),
    routenverlaufRueckzugMoeglich: nullable(details.routenverlauf?.rueckzug_moeglich),
    routenverlaufRueckzugBeschreibung: nullable(details.routenverlauf?.rueckzug_beschreibung),
    routenverlaufEinstiegshoehe: nullable(details.routenverlauf?.einstiegshoehe_m),
    seillaengenInfoAnzahlTotal: nullable(details.seillaengen_info?.anzahl_total),
    seillaengenVerbindenMoeglich: nullable(details.seillaengen_info?.verbinden?.moeglich),
    seillaengenVerbindenBeschreibung: nullable(details.seillaengen_info?.verbinden?.beschreibung),
    seillaengen: jsonArray(details.seillaengen_info?.seillaengen),
  };

  await tx.climbingTourKletternSchema.upsert({
    where: { baseId: input.reportId },
    create: { baseId: input.reportId, ...data },
    update: data,
  });
}

// Writes or clears arrival and access extraction details for the report.
async function persistAnreise(
  tx: ClimbingTourDetailsTransaction,
  input: ClimbingTourDetailsSchemaWriteInput,
): Promise<void> {
  const details = input.anreise;

  if (!details) {
    await tx.climbingTourAnreiseSchema.deleteMany({ where: { baseId: input.reportId } });
    return;
  }

  const data = {
    ausgangspunktName: nullable(details.ausgangspunkt?.name),
    ausgangspunktHoeheM: nullable(details.ausgangspunkt?.hoehe_m),
    parkplatzOrt: nullable(details.parkplatz?.ort),
    parkplatzHoeheM: nullable(details.parkplatz?.hoehe_m),
    parkplatzKosten: nullable(details.parkplatz?.kosten),
    parkplatzBesonderheiten: nullable(details.parkplatz?.besonderheiten),
    talstationName: nullable(details.talstation?.name),
    talstationHoeheM: nullable(details.talstation?.hoehe_m),
    oevVerkehrsmittel: jsonArray(details.oev?.verkehrsmittel),
    oevEndstation: nullable(details.oev?.endstation),
    oevLuftseilbahnMoeglich: nullable(details.oev?.luftseilbahn_moeglich),
    oevAnmeldungNoetig: nullable(details.oev?.anmeldung_noetig),
    vonPasshoeheAus: nullable(details.von_passhoehe_aus),
  };

  await tx.climbingTourAnreiseSchema.upsert({
    where: { baseId: input.reportId },
    create: { baseId: input.reportId, ...data },
    update: data,
  });
}

// Writes or clears approach and descent extraction details for the report.
async function persistZustiegUndAbstieg(
  tx: ClimbingTourDetailsTransaction,
  input: ClimbingTourDetailsSchemaWriteInput,
): Promise<void> {
  const details = input.zustieg_und_abstieg;

  if (!details) {
    await tx.climbingTourZustiegUndAbstiegSchema.deleteMany({
      where: { baseId: input.reportId },
    });
    return;
  }

  const data = {
    zustiegEinstiegsfindung: nullable(details.zustieg?.einstiegsfindung),
    zustiegBeschreibung: nullable(details.zustieg?.beschreibung),
    zustiegSchwierigkeit: nullable(details.zustieg?.schwierigkeit),
    zustiegHmAufstieg: nullable(details.zustieg?.hm_aufstieg),
    zustiegHmAbstieg: nullable(details.zustieg?.hm_abstieg),
    abstiegFuehrtZumEinstieg: nullable(details.abstieg?.fuehrt_zum_einstieg),
    abstiegSchwierigkeit: nullable(details.abstieg?.schwierigkeit),
    abstiegHmAufstieg: nullable(details.abstieg?.hm_aufstieg),
    abstiegHmAbstieg: nullable(details.abstieg?.hm_abstieg),
    verpflegungTyp: nullable(details.verpflegung_typ),
  };

  await tx.climbingTourZustiegUndAbstiegSchema.upsert({
    where: { baseId: input.reportId },
    create: { baseId: input.reportId, ...data },
    update: data,
  });
}

// Writes or clears hut, bivouac, and multi-day extraction details for the report.
async function persistStuetzpunkt(
  tx: ClimbingTourDetailsTransaction,
  input: ClimbingTourDetailsSchemaWriteInput,
): Promise<void> {
  const details = input.stuetzpunkt;

  if (!details) {
    await tx.climbingTourStuetzpunktSchema.deleteMany({ where: { baseId: input.reportId } });
    return;
  }

  const data = {
    typ: nullable(details.typ),
    mehrtags: nullable(details.mehrtags),
  };

  await tx.climbingTourStuetzpunktSchema.upsert({
    where: { baseId: input.reportId },
    create: { baseId: input.reportId, ...data },
    update: data,
  });
}

// Writes or clears guidebook and topo source extraction details for the report.
async function persistQuellen(
  tx: ClimbingTourDetailsTransaction,
  input: ClimbingTourDetailsSchemaWriteInput,
): Promise<void> {
  const details = input.quellen;

  if (!details) {
    await tx.climbingTourQuellenSchema.deleteMany({ where: { baseId: input.reportId } });
    return;
  }

  const data = {
    kletterfuehrer: jsonArray(details.kletterfuehrer),
    topoUrl: jsonArray(details.topo_url),
  };

  await tx.climbingTourQuellenSchema.upsert({
    where: { baseId: input.reportId },
    create: { baseId: input.reportId, ...data },
    update: data,
  });
}

// Writes or clears extractor report-quality details for the report.
async function persistBerichtsqualitaet(
  tx: ClimbingTourDetailsTransaction,
  input: ClimbingTourDetailsSchemaWriteInput,
): Promise<void> {
  const details = input.berichtsqualitaet;
  const completeness = computeClimbingTourCompleteness(input);

  const data = {
    score: nullable(details?.score),
    begruendung: nullable(details?.begruendung),
    extractionSchemaVersion: input.schemaVersion,
    vollstaendigkeitScore: completeness.score,
    vollstaendigkeitFilledFields: completeness.filledFields,
    vollstaendigkeitPossibleFields: completeness.possibleFields,
  };

  await tx.climbingTourBerichtsqualitaetSchema.upsert({
    where: { baseId: input.reportId },
    create: { baseId: input.reportId, ...data },
    update: data,
  });
}

// Writes or clears miscellaneous extraction details for the report.
async function persistBesonderes(
  tx: ClimbingTourDetailsTransaction,
  input: ClimbingTourDetailsSchemaWriteInput,
): Promise<void> {
  const details = input.besonderes;

  if (!details) {
    await tx.climbingTourBesonderesSchema.deleteMany({ where: { baseId: input.reportId } });
    return;
  }

  const data = {
    saisonalitaet: jsonNullable(details.saisonalitaet),
    frequentierung: nullable(details.frequentierung),
    bedingungen: jsonNullable(details.bedingungen),
    hinweise: jsonArray(details.hinweise),
  };

  await tx.climbingTourBesonderesSchema.upsert({
    where: { baseId: input.reportId },
    create: { baseId: input.reportId, ...data },
    update: data,
  });
}

// Converts missing optional scalar values into explicit nullable column writes.
function nullable<T>(value: T | null | undefined): T | null {
  return value ?? null;
}

// Converts missing optional extractor JSON into explicit SQL null writes.
function jsonNullable(value: unknown): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue {
  const jsonValue = stripUndefined(value);
  return jsonValue === undefined || jsonValue === null
    ? Prisma.DbNull
    : (jsonValue as Prisma.InputJsonValue);
}

// Removes undefined object properties because JSON fields can only store JSON values.
function stripUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item) ?? null);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, nestedValue]) => nestedValue !== undefined)
        .map(([key, nestedValue]) => [key, stripUndefined(nestedValue)]),
    );
  }

  return value;
}

// Converts missing optional extractor arrays into empty JSON array writes.
function jsonArray<T>(value: T[] | undefined): Prisma.InputJsonValue {
  return (value ?? []) as Prisma.InputJsonValue;
}
