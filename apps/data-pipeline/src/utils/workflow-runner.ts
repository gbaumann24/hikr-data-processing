import type { ClimbingDataPipelineDatabase } from '@hikr/shared';
import {
  mastra,
  runBaseLayerPipelineService,
  runClimbingPipelineService,
} from 'agent/mastra';

export type DataPipelineWorkflow = 'baselayer' | 'climbing';

const WORKFLOW_ALIASES: Record<string, DataPipelineWorkflow> = {
  baselayer: 'baselayer',
  'base-layer': 'baselayer',
  base_layer: 'baselayer',
  climbing: 'climbing',
  'climbing-pipeline': 'climbing',
};

export function getDataPipelineWorkflow(value = process.env.WORKFLOW ?? 'climbing'): DataPipelineWorkflow {
  const workflow = WORKFLOW_ALIASES[value.trim().toLowerCase()];

  if (!workflow) {
    throw new Error(`Unsupported WORKFLOW "${value}". Use "baselayer" or "climbing".`);
  }

  return workflow;
}

export async function runDataPipelineWorkflow({
  workflow,
  database,
  limit,
}: {
  workflow: DataPipelineWorkflow;
  database: ClimbingDataPipelineDatabase;
  limit?: number;
}) {
  if (workflow === 'baselayer') {
    return runBaseLayerPipelineService({ mastra, database, limit });
  }

  return runClimbingPipelineService({ mastra, database, limit });
}

export function formatDataPipelineWorkflow(workflow: DataPipelineWorkflow): string {
  return workflow === 'baselayer' ? 'baselayer workflow' : 'climbing workflow';
}
