import { definePartition } from '@core';
import { localModel } from './elements.ts';
import * as diagrams from './diagrams.ts';

export const partition = definePartition({
  id: 'service-b', name: 'Service B', elements: { localModel }, diagrams,
});
