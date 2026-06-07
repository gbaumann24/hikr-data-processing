import { MastraStorageExporter, Observability, SamplingStrategyType } from '@mastra/observability';
import { PostgresStore } from '@mastra/pg';

const defaultMastraTracesDatabaseUrl =
  'postgresql://mastra:mastra@127.0.0.1:5436/hikr_data_processing_mastra_traces';

export function isMastraObservabilityEnabled(): boolean {
  return readBooleanEnv('MASTRA_OBSERVABILITY_ENABLED', true);
}

export function createObservabilityConfig() {
  return new Observability({
    configs: {
      default: {
        serviceName: 'hikr-agent',
        sampling: { type: SamplingStrategyType.ALWAYS },
        exporters: [new MastraStorageExporter()],
      },
    },
  });
}

export function createObservabilityStore() {
  const observabilityStorage = new PostgresStore({
    id: 'hikr-observability',
    connectionString: process.env.MASTRA_TRACES_DATABASE_URL ?? defaultMastraTracesDatabaseUrl,
  });
  const store = observabilityStorage.stores.observability;

  if (!store) {
    throw new Error('Postgres observability storage is not available');
  }

  // The Studio route calls this lightweight method directly.
  store.listTracesLight = async (args) => {
    const { spans, pagination } = await store.listTraces(args);

    return {
      pagination,
      spans: spans.map(
        ({
          createdAt,
          updatedAt,
          name,
          spanType,
          isEvent,
          startedAt,
          parentSpanId,
          endedAt,
          error,
          entityType,
          entityId,
          entityName,
          traceId,
          spanId,
        }) => ({
          createdAt,
          updatedAt,
          name,
          spanType,
          isEvent,
          startedAt,
          parentSpanId,
          endedAt,
          error,
          entityType,
          entityId,
          entityName,
          traceId,
          spanId,
        }),
      ),
    };
  };

  return store;
}

function readBooleanEnv(name: string, defaultValue: boolean): boolean {
  const value = process.env[name]?.trim().toLowerCase();

  if (!value) {
    return defaultValue;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new Error(`${name} must be true or false`);
}
