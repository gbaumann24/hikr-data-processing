import { Prisma, type PrismaClient } from '../../../generated/client';
import type { ClimbingTourAggregateSchemaWriteInput } from '../types';

export async function upsertClimbingTourAggregate(
  prisma: PrismaClient,
  input: ClimbingTourAggregateSchemaWriteInput,
): Promise<void> {
  const data = {
    schemaVersion: input.schemaVersion,
    sourceReportCount: input.sourceReportCount,
    sourceReportIds: input.sourceReportIds,
    agentStatus: input.agentStatus,
    agentErrorMessage: input.agentErrorMessage,
    agentErrorDetails: jsonNullable(input.agentErrorDetails),
    payload: jsonRequired(input.payload),
    aggregatedAt: input.aggregatedAt,
  };

  await prisma.climbingTourAggregateSchema.upsert({
    where: { routeId: input.routeId },
    create: { routeId: input.routeId, ...data },
    update: data,
  });
}

function jsonRequired(value: unknown): Prisma.InputJsonValue {
  const jsonValue = stripUndefined(value);

  if (jsonValue === undefined || jsonValue === null) {
    throw new Error('Climbing tour aggregate payload must not be null');
  }

  return jsonValue as Prisma.InputJsonValue;
}

function jsonNullable(value: unknown): Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue {
  const jsonValue = stripUndefined(value);
  return jsonValue === undefined || jsonValue === null
    ? Prisma.DbNull
    : (jsonValue as Prisma.InputJsonValue);
}

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
