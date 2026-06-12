import type { Prisma, PrismaClient } from '../../../generated/client';
import type { ClimbingTourDetailsSchemaWriteInput } from '../types';

type ClimbingTourDetailsTransaction = Prisma.TransactionClient;

// Persists the structured extraction details for an existing climbing tour base row.
export async function upsertClimbingTourDetails(
  prisma: PrismaClient,
  input: ClimbingTourDetailsSchemaWriteInput,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await assertClimbingTourBaseExists(tx, input.reportId);
    await persistAusruestung(tx, input);
    await persistZeitbedarf(tx, input);
    await persistAbsicherung(tx, input);
    await persistSchuhwerk(tx, input);
    await persistGelaendeUndGefahren(tx, input);
    await persistKlettern(tx, input);
    await persistAnreise(tx, input);
    await persistZustiegUndAbstieg(tx, input);
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
    seilLaengeM: nullable(details.seil?.laenge_m),
    mobileAbsicherungErforderlich: nullable(details.mobile_absicherung?.erforderlich),
    mobileAbsicherungEmpfohlen: nullable(details.mobile_absicherung?.empfohlen),
    mobileAbsicherungVerwendet: nullable(details.mobile_absicherung?.verwendet),
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
    kletternTyp: nullable(details.klettern?.typ),
    abstiegTyp: nullable(details.abstieg?.typ),
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
    gefahren: jsonArray(details.gefahren),
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
    schluesselstellenVorhanden: nullable(details.schluesselstellen?.vorhanden),
    schluesselstellenStellen: jsonArray(details.schluesselstellen?.stellen),
    schwierigkeitVerhaeltnis: nullable(details.schwierigkeit?.verhaeltnis),
    schwierigkeitBeschreibung: nullable(details.schwierigkeit?.beschreibung),
    abseilenMoeglich: nullable(details.abseilen?.moeglich),
    abseilenAnzahl: nullable(details.abseilen?.anzahl),
    abseilenLaengenM: jsonArray(details.abseilen?.laengen_m),
    abseilenZumEinstieg: nullable(details.abseilen?.zum_einstieg),
    abseilenAbseilpiste: nullable(details.abseilen?.abseilpiste),
    charakterKletterstil: jsonArray(details.charakter?.kletterstil),
    routenverlaufRoutenfindung: nullable(details.routenverlauf?.routenfindung),
    routenverlaufBeschreibung: nullable(details.routenverlauf?.beschreibung),
    routenverlaufRueckzugMoeglich: nullable(details.routenverlauf?.rueckzug_moeglich),
    routenverlaufRueckzugBeschreibung: nullable(details.routenverlauf?.rueckzug_beschreibung),
    seillaengenVerbindenMoeglich: nullable(details.seillaengen_verbinden?.moeglich),
    seillaengenVerbindenBeschreibung: nullable(details.seillaengen_verbinden?.beschreibung),
    seillaengen: jsonArray(details.seillaengen),
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
    parkplatzOrt: nullable(details.parkplatz?.ort),
    parkplatzKosten: nullable(details.parkplatz?.kosten),
    parkplatzBesonderheiten: nullable(details.parkplatz?.besonderheiten),
    oevVerkehrsmittel: jsonArray(details.oev?.verkehrsmittel),
    oevEndstation: nullable(details.oev?.endstation),
    oevLuftseilbahnMoeglich: nullable(details.oev?.luftseilbahn_moeglich),
    oevAnmeldungNoetig: nullable(details.oev?.anmeldung_noetig),
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
    abstiegFuehrtZumEinstieg: nullable(details.abstieg?.fuehrt_zum_einstieg),
    abstiegVerpflegungMoeglich: nullable(details.abstieg?.verpflegung_moeglich),
    abstiegVerpflegungBeschreibung: nullable(details.abstieg?.verpflegung_beschreibung),
    abstiegSchwierigkeit: nullable(details.abstieg?.schwierigkeit),
  };

  await tx.climbingTourZustiegUndAbstiegSchema.upsert({
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
    saisonalitaet: nullable(details.saisonalitaet),
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

// Converts missing optional extractor arrays into empty JSON array writes.
function jsonArray<T>(value: T[] | undefined): Prisma.InputJsonValue {
  return (value ?? []) as Prisma.InputJsonValue;
}
