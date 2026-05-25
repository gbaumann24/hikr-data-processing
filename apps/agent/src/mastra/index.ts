import { loadRootEnv } from '../utils';
import { Mastra } from '@mastra/core/mastra';
import { MastraCompositeStore } from '@mastra/core/storage';
import { DuckDBStore } from '@mastra/duckdb';
import { LibSQLStore } from '@mastra/libsql';
import {
  MastraStorageExporter,
  Observability,
  SamplingStrategyType,
} from '@mastra/observability';
import { climbingExtractionAgent } from './agents/climbing-extraction-agent';
import { climbingPreprocessorAgent } from './agents/climbing-preprocessor-agent';
import { baseLayerWorkflow } from './workflows/baselayer';
import { climbingPipelineWorkflow } from './workflows/climbing';
import { skiTouringPipelineWorkflow } from './workflows/ski-touring';

loadRootEnv();

export { climbingExtractionAgent } from './agents/climbing-extraction-agent';
export { climbingPreprocessorAgent } from './agents/climbing-preprocessor-agent';
export { baseLayerWorkflow } from './workflows/baselayer';
export { climbingPipelineWorkflow } from './workflows/climbing';
export { skiTouringPipelineWorkflow } from './workflows/ski-touring';
export { runBaseLayerPipelineService } from './services/baselayer-pipeline-service';
export { runClimbingPipelineService } from './services/climbing-pipeline-service';
export type { ClimbingPipelineProgressEvent } from './services/climbing-pipeline-service';

export { ACTIVITY } from '@hikr/shared';
export type { HikrOrgPostBaseLayerInput, ReportBaseSchemaWriteInput } from '@hikr/shared';
export type {
  ClimbingDataPipelineDatabase,
  ClimbingTourBasePreprocessorOutput,
  ClimbingGardenBasePreprocessorOutput,
} from '@hikr/shared';

const observabilityStorage = new DuckDBStore({
  id: 'hikr-observability',
  path: './mastra-observability.duckdb',
});
const observabilityStore = observabilityStorage.observability;

// DuckDB's facade currently omits this method, while Studio calls it for trace lists.
observabilityStore.listTracesLight = async (args) => {
  const { spans, pagination } = await observabilityStore.listTraces(args);

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

export const mastra = new Mastra({
  storage: new MastraCompositeStore({
    id: 'hikr-mastra-storage',
    default: new LibSQLStore({
      id: 'hikr-mastra-libsql',
      url: 'file:./mastra.db',
    }),
    domains: {
      observability: observabilityStore,
    },
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'hikr-agent',
        sampling: { type: SamplingStrategyType.ALWAYS },
        exporters: [new MastraStorageExporter()],
      },
    },
  }),
  agents: {
    'climbing-extraction-agent': climbingExtractionAgent,
    'climbing-preprocessor-agent': climbingPreprocessorAgent,
  },
  workflows: {
    baselayer: baseLayerWorkflow,
    'climbing-pipeline': climbingPipelineWorkflow,
    'ski-touring-pipeline': skiTouringPipelineWorkflow,
  },
});
