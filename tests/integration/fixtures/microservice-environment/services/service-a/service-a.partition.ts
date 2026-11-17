import { definePartition } from '@core';
import { localModel } from './elements.ts';
import * as diagrams from './diagrams.ts';

export const partition = definePartition({
  id: 'service-a', name: 'Service A', elements: { localModel }, diagrams,
});
