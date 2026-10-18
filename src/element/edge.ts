import { registerIncoming, registerOutgoing } from './adjacency.js';
import { ModelElement } from './model-element.js';
import type { Node } from './node.js';

export class Edge extends ModelElement {
  public readonly from: Node | undefined;
  public readonly to: Node | undefined;

  public constructor(from: Node | undefined, to: Node | undefined) {
    super();
    this.from = from;
    this.to = to;

    if (from !== undefined) {
      registerOutgoing(this, from);
    }

    if (to !== undefined) {
      registerIncoming(this, to);
    }
  }

  public toNotation(): string {
    return 'Edge';
  }
}
