import type { Edge } from './edge.ts';
import type { Node } from './node.ts';

export type GraphElement = Node | Edge;

export const graphKind = Symbol.for('governed-model-core.graphKind.v1');
