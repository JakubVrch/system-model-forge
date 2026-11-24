import { definePartition } from 'governed-model-core';
import * as metamodel from './_metamodel/index.ts';

export const partition = definePartition({
  id: 'services', name: 'Services', metamodel,
});
export type { ServiceNode, EventFlow } from './_metamodel/index.ts';
