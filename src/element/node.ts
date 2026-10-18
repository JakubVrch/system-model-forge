import { getConnectedEdges, getIncomingEdges, getOutgoingEdges } from './adjacency.js';
import { ModelElement } from './model-element.js';
import type { Edge } from './edge.js';

export class Node extends ModelElement {
  public constructor() {
    super();
  }

  public toNotation(): string {
    return 'Node';
  }

  public get edges(): readonly Edge[] {
    return getConnectedEdges(this) as readonly Edge[];
  }

  public get outgoing(): readonly Edge[] {
    return getOutgoingEdges(this) as readonly Edge[];
  }

  public get incoming(): readonly Edge[] {
    return getIncomingEdges(this) as readonly Edge[];
  }
}
