# TypeScript Declaration Contract

## Public Module Surface

The core package root exports the element classes, graph element type, and
diagram exporter:

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

export type GraphElement = Node | Edge;

export declare function exportDiagram(
  elements: readonly GraphElement[],
): string;
```

`Node` and `Edge` are instantiable core classes that authors can subclass. A
subclass may provide specialized behavior and override `toNotation()`. Core
elements provide useful default notation. Elements carry no `id`; edge endpoints are
readonly; custom notation must be deterministic for unchanged instances.

The core defaults are `"Node"` and `"Edge"`, respectively. A custom notation
method returns a single-line fragment.

## Traversal Semantics

`Edge.from` and `Edge.to` are references to the supplied nodes, or `undefined`
when a node is missing; `undefined` is a valid value. Construction never throws
for an `undefined` endpoint (see the
[element traversal contract](element-traversal-contract.md) for the tolerance
rules). Edge construction registers the edge in the private storage of its defined `from` node
(outgoing) and `to` node (incoming). The `Node.edges`, `Node.outgoing`, and
`Node.incoming` getters return frozen arrays of references to those edges:
`edges` holds every connected edge once (a self-loop once, parallel edges
separately); `outgoing` holds edges whose `from` is the node; `incoming` holds
edges whose `to` is the node. A self-loop is in both `outgoing` and `incoming`.
A node without edges has empty arrays. Other selection uses native `filter()`.

## Diagram Contract

`exportDiagram()` accepts exactly the supplied array and does not recursively
add nodes referenced by selected edges. It emits all supplied entries, with
parallel edges represented separately. Each edge line identifies both endpoints
by the endpoint's notation, or by the bare token `undefined` for a missing endpoint, even when a node
is omitted from the selection; export never fails on such an edge and does not
add a node for it.

The textual format is a deterministic frame:

```text
diagram
  node: <node notation>
  edge: <from notation | undefined> -> <to notation | undefined>: <edge notation>
end
```

The exporter sorts complete element lines by code-unit string order, retains
duplicate supplied entries, and ends the document with a newline. Empty input
is exactly `diagram\nend\n`. Notation text is emitted as-is, so
subclasses should make it identifying. Custom notation supplies the text within
the standard element line; it does not replace the line structure or edge endpoints.

Ordinary JavaScript array methods, including `filter()`, are the supported way
to select elements before export. No dedicated filter/query function or
notation registry is exported by this feature.
