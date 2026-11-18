import { graphKind } from './graph-element.ts';
import { getConnectedEdges, getIncomingEdges, getOutgoingEdges } from './adjacency.ts';
import { ModelElement } from './model-element.ts';
import type { Edge } from './edge.ts';

export class Node extends ModelElement {
  public constructor(public readonly id: string) {
    super();
  }

  public toNotation(): string {
    return 'Node';
  }

  public get edges(): ReadonlySet<Edge> {
    return getConnectedEdges(this) as ReadonlySet<Edge>;
  }

  public get outgoing(): ReadonlySet<Edge> {
    return getOutgoingEdges(this) as ReadonlySet<Edge>;
  }

  public get incoming(): ReadonlySet<Edge> {
    return getIncomingEdges(this) as ReadonlySet<Edge>;
  }
}

Object.defineProperty(Node.prototype, graphKind, {
  value: Object.freeze({ version: 1, kind: 'node' }),
  enumerable: false, writable: false, configurable: false,
});
