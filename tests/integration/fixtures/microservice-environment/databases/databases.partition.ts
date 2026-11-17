import { definePartition } from '@core';
import { databases } from './elements.ts';
import { database } from './_metamodel/database-node.ts';

export const partition = definePartition({
  id: 'databases', name: 'Databases', elements: { databases }, metamodel: { database },
});
export type { DatabaseNode } from './_metamodel/database-node.ts';
