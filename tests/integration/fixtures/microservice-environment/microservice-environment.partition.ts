import { definePartition } from '@core';

// The folder establishes this partition's children; no contributions are forwarded.
export const partition = definePartition({
  id: 'microservice-environment', name: 'Microservice environment',
});
