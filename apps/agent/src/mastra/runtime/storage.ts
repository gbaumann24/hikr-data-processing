import { MastraCompositeStore } from '@mastra/core/storage';
import { LibSQLStore } from '@mastra/libsql';
import { createObservabilityStore } from './observability';

export function createMastraStorage({ observabilityEnabled }: { observabilityEnabled: boolean }) {
  const observabilityStore = observabilityEnabled ? createObservabilityStore() : undefined;

  return new MastraCompositeStore({
    id: 'hikr-mastra-storage',
    default: new LibSQLStore({
      id: 'hikr-mastra-libsql',
      url: 'file:./mastra.db',
    }),
    ...(observabilityStore ? { domains: { observability: observabilityStore } } : {}),
  });
}
