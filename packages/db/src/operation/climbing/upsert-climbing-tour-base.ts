import type { PrismaClient } from '../../../generated/client';
import type { ClimbingTourBasePreprocessorOutput } from '../types';

type SummitLookup = Pick<PrismaClient['summitSchema'], 'findFirst'>;

export async function upsertClimbingTourBase(
  prisma: PrismaClient,
  input: ClimbingTourBasePreprocessorOutput,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const reportBase = await tx.reportBaseSchema.findUnique({
      where: { reportId: input.reportId },
      select: { activity: true, subActivity: true, canton: true },
    });

    if (!reportBase?.activity || !reportBase.subActivity || !reportBase.canton) {
      throw new Error(
        `Cannot persist climbing tour route for report ${input.reportId.toString()} without activity, subActivity, and canton`,
      );
    }

    const routeName = normalizeName(input.routeName);
    const summitName = normalizeName(input.summit);

    if (!routeName || !summitName) {
      throw new Error(
        `Cannot persist climbing tour route for report ${input.reportId.toString()} without route name and summit`,
      );
    }

    const duplicationRisk = await hasAdjacentCantonSummitNameMatch(tx.summitSchema, {
      summitName,
      canton: reportBase.canton,
    });

    const summit = await tx.summitSchema.upsert({
      where: {
        summitNameCanton: {
          summitName,
          canton: reportBase.canton,
        },
      },
      create: {
        summitName,
        summitNames: [summitName],
        canton: reportBase.canton,
        duplicationRisk,
      },
      update: {
        duplicationRisk,
      },
    });

    const inputRouteNames = normalizeRouteNames(input.routeNames, routeName);
    const route = await tx.routeSchema.upsert({
      where: {
        activityRouteNameSummitCanton: {
          activity: reportBase.activity,
          routeName,
          summitId: summit.id,
          canton: reportBase.canton,
        },
      },
      create: {
        activity: reportBase.activity,
        subActivity: reportBase.subActivity,
        routeName,
        routeNames: inputRouteNames,
        summitId: summit.id,
        canton: reportBase.canton,
      },
      update: {
        subActivity: reportBase.subActivity,
      },
    });

    const routeNames = normalizeRouteNames([...route.routeNames, ...inputRouteNames], routeName);

    if (!areEqualStringArrays(route.routeNames, routeNames)) {
      await tx.routeSchema.update({
        where: { id: route.id },
        data: { routeNames },
      });
    }

    await tx.climbingTourBaseSchema.upsert({
      where: { reportId: input.reportId },
      create: {
        reportId: input.reportId,
        schemaVersion: input.schemaVersion,
        routeId: route.id,
      },
      update: {
        schemaVersion: input.schemaVersion,
        routeId: route.id,
      },
    });
  });
}

async function hasAdjacentCantonSummitNameMatch(
  summitSchema: SummitLookup,
  { summitName, canton }: { summitName: string; canton: string },
): Promise<boolean> {
  const adjacentCantons = getAdjacentCantons(canton);

  if (adjacentCantons.length === 0) {
    return false;
  }

  const duplicate = await summitSchema.findFirst({
    where: {
      canton: { in: adjacentCantons },
      OR: [{ summitName }, { summitNames: { has: summitName } }],
    },
    select: { id: true },
  });

  return duplicate !== null;
}

function normalizeRouteNames(routeNames: string[], routeName: string): string[] {
  return [
    ...new Set(
      [routeName, ...routeNames]
        .map((name) => name.replace(/\s+/g, ' ').trim())
        .filter((name) => name !== ''),
    ),
  ];
}

function normalizeName(name: string): string {
  return name.replace(/\s+/g, ' ').trim();
}

function areEqualStringArrays(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function getAdjacentCantons(canton: string): string[] {
  return ADJACENT_CANTONS_BY_CANTON.get(canton) ?? [];
}

function buildAdjacentCantonMap(
  cantonPairs: Array<readonly [string, string]>,
): Map<string, string[]> {
  const adjacentCantonsByCanton = new Map<string, Set<string>>();

  for (const [left, right] of cantonPairs) {
    addAdjacentCanton(adjacentCantonsByCanton, left, right);
    addAdjacentCanton(adjacentCantonsByCanton, right, left);
  }

  return new Map(
    [...adjacentCantonsByCanton.entries()].map(([canton, adjacentCantons]) => [
      canton,
      [...adjacentCantons].sort((left, right) => left.localeCompare(right)),
    ]),
  );
}

function addAdjacentCanton(
  adjacentCantonsByCanton: Map<string, Set<string>>,
  canton: string,
  adjacentCanton: string,
): void {
  const adjacentCantons = adjacentCantonsByCanton.get(canton) ?? new Set<string>();
  adjacentCantons.add(adjacentCanton);
  adjacentCantonsByCanton.set(canton, adjacentCantons);
}

const ADJACENT_CANTONS_BY_CANTON = buildAdjacentCantonMap([
  ['Aargau', 'Basel Land'],
  ['Aargau', 'Bern'],
  ['Aargau', 'Luzern'],
  ['Aargau', 'Solothurn'],
  ['Aargau', 'Zug'],
  ['Aargau', 'Zürich'],
  ['Appenzell', 'St.Gallen'],
  ['Basel Land', 'Basel Stadt'],
  ['Basel Land', 'Jura'],
  ['Basel Land', 'Solothurn'],
  ['Bern', 'Freiburg'],
  ['Bern', 'Jura'],
  ['Bern', 'Luzern'],
  ['Bern', 'Neuenburg'],
  ['Bern', 'Nidwalden'],
  ['Bern', 'Obwalden'],
  ['Bern', 'Solothurn'],
  ['Bern', 'Uri'],
  ['Bern', 'Waadt'],
  ['Bern', 'Wallis'],
  ['Freiburg', 'Neuenburg'],
  ['Freiburg', 'Waadt'],
  ['Genf', 'Waadt'],
  ['Glarus', 'Graubünden'],
  ['Glarus', 'Schwyz'],
  ['Glarus', 'St.Gallen'],
  ['Glarus', 'Uri'],
  ['Graubünden', 'St.Gallen'],
  ['Graubünden', 'Tessin'],
  ['Graubünden', 'Uri'],
  ['Jura', 'Neuenburg'],
  ['Jura', 'Solothurn'],
  ['Luzern', 'Nidwalden'],
  ['Luzern', 'Obwalden'],
  ['Luzern', 'Schwyz'],
  ['Luzern', 'Zug'],
  ['Neuenburg', 'Waadt'],
  ['Nidwalden', 'Obwalden'],
  ['Nidwalden', 'Schwyz'],
  ['Nidwalden', 'Uri'],
  ['Obwalden', 'Uri'],
  ['Schaffhausen', 'Thurgau'],
  ['Schaffhausen', 'Zürich'],
  ['Schwyz', 'St.Gallen'],
  ['Schwyz', 'Uri'],
  ['Schwyz', 'Zug'],
  ['Schwyz', 'Zürich'],
  ['St.Gallen', 'Thurgau'],
  ['St.Gallen', 'Zürich'],
  ['Tessin', 'Uri'],
  ['Tessin', 'Wallis'],
  ['Thurgau', 'Zürich'],
  ['Uri', 'Wallis'],
  ['Waadt', 'Wallis'],
  ['Zug', 'Zürich'],
]);
