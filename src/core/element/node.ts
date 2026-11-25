import { getConnectedEdges, getIncomingEdges, getOutgoingEdges } from './adjacency.ts';
import { ModelElement } from './model-element.ts';
import type { Edge } from './edge.ts';

export class Node extends ModelElement {
  public constructor(public readonly id: string, name: string) {
    super(name);
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
