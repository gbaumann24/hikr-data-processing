import { describe, expect, test } from 'bun:test';
import {
  formatDataPipelineWorkflow,
  getDataPipelineWorkflow,
} from '../src/utils/workflow-runner';

describe('workflow runner', () => {
  test('normalizes workflow aliases', () => {
    expect(getDataPipelineWorkflow('baselayer')).toBe('baselayer');
    expect(getDataPipelineWorkflow('base-layer')).toBe('baselayer');
    expect(getDataPipelineWorkflow('base_layer')).toBe('baselayer');
    expect(getDataPipelineWorkflow('climbing')).toBe('climbing');
    expect(getDataPipelineWorkflow('climbing-pipeline')).toBe('climbing');
  });

  test('formats workflow names for logs', () => {
    expect(formatDataPipelineWorkflow('baselayer')).toBe('baselayer workflow');
    expect(formatDataPipelineWorkflow('climbing')).toBe('climbing workflow');
  });

  test('rejects unsupported workflows', () => {
    expect(() => getDataPipelineWorkflow('ski-touring')).toThrow(
      'Unsupported WORKFLOW "ski-touring". Use "baselayer" or "climbing".',
    );
  });
});
