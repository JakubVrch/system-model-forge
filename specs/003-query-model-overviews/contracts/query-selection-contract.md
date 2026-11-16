# Public Contract: Query and Selection Helpers

Add these named exports to `src/index.ts`; retain every existing export and the existing `GraphElement` declaration location.

```ts
export function connectedNodes(
  nodes: readonly Node[],
  predicate: (edge: Edge) => boolean,
  direction: 'outgoing' | 'incoming' | 'both',
): readonly Node[];

export function cleanSelection(
  elements: readonly GraphElement[],
): readonly GraphElement[];
```

`Node`, `Edge`, and `GraphElement` refer to existing public package types. No new runtime query class, predicate alias, domain type, or merge helper is exported.

## connectedNodes

- Visit supplied starting nodes in order, skipping repeated references after the first occurrence.
- Direction is required: `'outgoing'` reads `node.outgoing` and reaches `edge.to`; `'incoming'` reads `node.incoming` and reaches `edge.from`; `'both'` reads `node.edges` and reaches the opposite endpoint relative to the current start (`edge.from === start ? edge.to : edge.from`). No direction is implicit.
- Read the chosen adjacency snapshot once per unique start, preserving its existing registration order. Both-direction traversal uses incident order, not outgoing-then-incoming concatenation. Never expand reached-node adjacency unless that node is separately supplied as a start.
- Call the predicate with the original edge once per visited adjacency entry, including entries with undefined opposite endpoints. Acceptance precedes endpoint inspection; rejection prevents the hop regardless of endpoint type or properties.
- Accepted edges with undefined opposite endpoints contribute nothing. Defined reached nodes are returned once by identity in first-discovery order. Distinct equal-label nodes remain distinct.
- Parallel edges are evaluated separately. A self-loop appears once in a start's incident snapshot, is evaluated once in all modes, and contributes that start once when accepted. In both mode an edge between two distinct supplied starts is evaluated once for each start and may reach each endpoint. Cycles never trigger recursive traversal.
- Empty starts, isolated starts, or no accepted defined targets yield a fresh frozen empty array.
- Return a fresh frozen array on every call; do not clone, freeze, or mutate input elements or arrays. Do not construct edges or change adjacency.
- Predicates must not mutate graph state. A thrown predicate error propagates unchanged; no partial result is returned. Validation of arbitrary JavaScript values outside the declared types is out of scope.
- Expected cost is O(S + A) time and O(U + T + D) temporary space, for S input starts, U unique starts, A adjacency entries in the chosen direction across those unique starts, T unique reached nodes, and D maximum chosen snapshot size. No global graph scan or recursive work.

## cleanSelection

- Build membership from all Node references in the input, independently of input position.
- Retain every input node entry, including isolated nodes. Retain an edge entry iff both endpoints are defined and are members of that node-identity set.
- Preserve original input order among retained entries. Preserve distinct parallel edges, qualifying self-loops, and repeated references if supplied repeatedly. This operation does not merge or deduplicate.
- Never add endpoints, discover new edges, or read graph adjacency. Edges absent from the selection stay absent even if their endpoints are selected.
- Return a fresh frozen readonly array, using original references. Empty input or edges-only input yields an empty array.
- Expected cost is O(N) time and O(N) space using one membership-building pass and one filtering pass. Do not search the input array per endpoint.

## Pipeline and compatibility

Service fixtures use ordinary array filtering, connectedNodes with an event-edge predicate and explicit `'outgoing'` direction, `[...new Set<GraphElement>([...localModel, ...targets])]`, then cleanSelection. Merging places the first occurrence of each reference at its original position. Framework helpers know nothing about service/topic types.

Direct `Node.outgoing`, `incoming`, and `edges` behavior is unchanged. `exportDiagram` continues to allow incomplete selections, retains nodes-first formatting and its existing defaults, and never calls cleanup implicitly. `saveDiagram` remains unchanged. Adding the two named functions is an additive public API change; declaration and exact-runtime-export tests must cover it.

## Required contract evidence

- Identity assertions use `toBe` per ordered entry and exact lengths, not structural equality alone.
- Frozen results reject array mutation; source arrays and elements are not newly frozen by helpers.
- Readonly arrays typecheck as inputs; results typecheck as the declared readonly arrays. All three direction literals typecheck; omitted or invalid directions are rejected. Predicate parameters expose Edge endpoints; mixed node/edge arrays are not valid traversal starts.
- Unit coverage includes empty/isolated/no-match inputs, edge kinds and properties, missing endpoints in each direction, outgoing/incoming/both modes, incident ordering, shared edges between starts, one-hop cycles, self-loops, repeated starts/targets, parallel edges, equal labels, late-position endpoints, duplicate cleanup entries, and source/adjacency preservation.
- Predicate counts equal direction-selected adjacency-entry counts of unique selected starts, including undefined-target and rejected edges, and do not grow after disconnected graph construction.
- Integration verifies both independently derived service overviews, explicit expected text, persistence, and 100 full pipeline repetitions.
