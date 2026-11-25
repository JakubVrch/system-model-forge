import { Edge, Node } from '@core';
import { CliError } from '@cli/errors';
import type { Identity } from '@cli/source/model';

/** Read inherited data descriptors without evaluating authored getters. */
export function readData(value: unknown, key: PropertyKey): unknown {
  if ((typeof value !== 'object' || value === null) && typeof value !== 'function') return undefined;
  for (let current = value; current !== null; current = Object.getPrototypeOf(current)) {
    const descriptor = Object.getOwnPropertyDescriptor(current, key);
    if (descriptor) return 'value' in descriptor ? descriptor.value : undefined;
  }
  return undefined;
}

export function kindOf(value: unknown): 'node' | 'edge' {
  if (value instanceof Node) return 'node';
  if (value instanceof Edge) return 'edge';
  throw new CliError('Expected an instance of Node or Edge from the same governed-model-core package as the CLI');
}

export function describeElement(value: object): { identity: Identity; modelType: string | null } {
  const id = readData(value, 'id');
  const name = readData(value, 'name');
  if (typeof id !== 'string') throw new CliError('Element requires a string id');
  if (typeof name !== 'string') throw new CliError('Element requires a string name');

  const constructor = readData(Object.getPrototypeOf(value), 'constructor');
  const type = readData(constructor, 'name');
  const modelType = typeof type === 'string' && type && !['Node', 'Edge', 'Object'].includes(type) ? type : null;
  return { identity: { id, name }, modelType };
}
