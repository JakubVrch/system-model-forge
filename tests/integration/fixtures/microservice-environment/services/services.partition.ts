import { definePartition } from '@core';
import * as metamodel from './_metamodel/index.ts';

export const partition = definePartition({
  id: 'services', name: 'Services', metamodel,
});
export type { ServiceNode, ModuleNode, ModuleComposition, EventFlow, DatabaseUsage } from './_metamodel/index.ts';
