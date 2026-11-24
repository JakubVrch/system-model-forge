import { definePartition } from 'governed-model-core';
import { shared } from './shared.ts';
process.stdout.write('direct source stdout\n');
setInterval(() => {}, 1000);
export { shared };
export const partition = definePartition({ id: 'a', name: 'A', elements: { shared: new Set([shared]) } });
