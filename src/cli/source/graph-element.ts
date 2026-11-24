import { Edge, Node } from '@core';
import { CliError, type ElementView } from '@cli/result';

/** Read inherited data descriptors without evaluating authored getters. */
export function readData(value: unknown, key: PropertyKey): unknown {
  if ((typeof value !== 'object' || value === null) && typeof value !== 'function') return undefined;
  for (let current = value; current !== null; current = Object.getPrototypeOf(current)) {
    const descriptor = Object.getOwnPropertyDescriptor(current, key);
    if (descriptor) return 'value' in descriptor ? descriptor.value : undefined;
  }
  return undefined;
}

export function kindOf(value: unknown): ElementView['kind'] {
  if (value instanceof Node) return 'node';
  if (value instanceof Edge) return 'edge';
  throw new CliError('Expected an instance of Node or Edge from the same governed-model-core package as the CLI');
}
