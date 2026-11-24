import { definePartition } from 'governed-model-core';
import { shared } from '../shared.ts';
import { shared as fromA } from '../a.partition.ts';
if (shared !== fromA) throw new Error('shared graph identity lost');
export const partition = definePartition({ id: 'b', name: 'B' });
