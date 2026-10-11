# Element Traversal Contract

The core API exposes direct navigation through references to existing objects.
It does not provide a query language, a traversal-direction option or function, or a
separate element-filtering operation.

```ts
export abstract class ModelElement {
  protected constructor();

  abstract toNotation(): string;
}

export class Node extends ModelElement {
  get edges(): readonly Edge[];
  get outgoing(): readonly Edge[];
  get incoming(): readonly Edge[];

  constructor();
  toNotation(): string;
}

export class Edge extends ModelElement {
  readonly from: Node | undefined;
  readonly to: Node | undefined;

  constructor(from: Node | undefined, to: Node | undefined);
  toNotation(): string;
}

## Tolerance for Incomplete Models

Construction is lenient so that bulk-imported elements can always be built into
a model, even when the data is incomplete. Detecting and reporting such problems
is the job of a later validation feature.

- `undefined` is a valid `from` or `to` value: it means the node is missing
  (for example, a lookup that found nothing). Elements have no `id`.
- Constructing a node or edge never throws for an `undefined` endpoint or an
  unconnected node.
- An edge registers only with its defined endpoints; an `undefined` endpoint
  contributes to no `edges`, `outgoing`, or `incoming` array.
- Endpoints are not patched later, which keeps edges immutable; callers rebuild
  an edge once the node exists.

`Node` and `Edge` are directly instantiable and may be extended. A specialized
class may override `toNotation()`. The core defaults are `"Node"` and `"Edge"`;
custom notation methods return a single-line string.

`Node.edges` is a getter returning an array of references to all edge objects connected to that
node, in edge creation order. `Node.outgoing` holds those whose `from` is the
node and `Node.incoming` those whose `to` is the node; a self-loop appears once in
`edges` and in both `outgoing` and `incoming`. `Edge.from` and `Edge.to` are references to the two supplied nodes, or `undefined`. No element is copied. `from`
and `to` are readonly, and the returned arrays are frozen, so callers cannot
modify them.

Creating an edge registers it with its `from` node's outgoing storage and its
`to` node's incoming storage; `edges` is their union. Parallel edges remain
separate objects. Reading never changes the model.

Further selection uses ordinary JavaScript array operations:

```ts
const neighbours = node.outgoing
  .map((edge) => edge.to)
  .filter((other) => other !== undefined);
const serviceEdges = node.edges.filter((edge) => edge instanceof ServiceEdge);
```

No built-in filter, query, partition, assembly, or multi-hop traversal API is
part of this contract.
