import { registerIncoming, registerOutgoing } from './adjacency.ts';
import { ModelElement } from './model-element.ts';
import type { Node } from './node.ts';

/** A typed node reference that may be unresolved or absent. */
export type Endpoint<T extends Node = Node> = T | undefined;

/** Preserve endpoint subtypes while retaining support for incomplete relationships. */
export class Edge<From extends Node = Node, To extends Node = Node> extends ModelElement {
  public readonly from: Endpoint<From>;
  public readonly to: Endpoint<To>;

  public constructor(from: Endpoint<From>, to: Endpoint<To>) {
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
