# Public Contract: Query and Selection Helpers

Add these named exports to `src/index.ts`; retain every existing export. Define `GraphElement` in `src/element/graph-element.ts`, with a compatibility type re-export at `src/export/export-diagram.ts` and a direct type export through `src/index.ts`.

```ts
export function connectedNodes(
  nodes: ReadonlySet<Node>,
  predicate: (edge: Edge) => boolean,
  direction: 'outgoing' | 'incoming' | 'both',
): ReadonlySet<Node>;

export function cleanSelection(
  elements: ReadonlySet<GraphElement>,
): ReadonlySet<GraphElement>;
```

`Node`, `Edge`, and `GraphElement` refer to existing public package types. No runtime query class, predicate alias, domain type, or merge helper is exported. The collection utility readonlySet is also public.

## connectedNodes

- Visit the supplied ReadonlySet of starting nodes in insertion order. Input uniqueness is guaranteed by the set contract, not by query-local normalization.
- Direction is required: `'outgoing'` reads `node.outgoing` and reaches `edge.to`; `'incoming'` reads `node.incoming` and reaches `edge.from`; `'both'` reads `node.edges` and reaches the opposite endpoint relative to the current start (`edge.from === start ? edge.to : edge.from`). No direction is implicit.
- Read the chosen adjacency snapshot once per unique start, preserving its existing registration order. Both-direction traversal uses incident order, not outgoing-then-incoming concatenation. Never expand reached-node adjacency unless that node is separately supplied as a start.
- Call the predicate with the original edge once per visited adjacency entry, including entries with undefined opposite endpoints. Acceptance precedes endpoint inspection; rejection prevents the hop regardless of endpoint type or properties.
- Accepted edges with undefined opposite endpoints contribute nothing. Defined reached nodes are returned once by identity in first-discovery order. Distinct equal-label nodes remain distinct.
- Parallel edges are evaluated separately. A self-loop appears once in a start's incident snapshot, is evaluated once in all modes, and contributes that start once when accepted. In both mode an edge between two distinct supplied starts is evaluated once for each start and may reach each endpoint. Cycles never trigger recursive traversal.
- Empty starts, isolated starts, or no accepted defined targets yield a fresh protected empty set.
- Return a fresh protected readonly set on every call; do not clone, freeze, or mutate input elements or sets. Do not construct edges or change adjacency.
- Predicates must not mutate graph state. A thrown predicate error propagates unchanged; no partial result is returned. Validation of arbitrary JavaScript values outside the declared types is out of scope.
- Expected cost is O(S + A) time and O(T + D) temporary space, for S set members (starting nodes), A adjacency entries in the chosen direction across those starts, T unique reached nodes, and D maximum chosen snapshot size. No global graph scan or recursive work.

## cleanSelection

- Use the supplied ReadonlySet directly for endpoint membership, independently of iteration position.
- Retain every input node entry, including isolated nodes. Retain an edge entry iff both endpoints are defined and are members of the supplied selection set.
- Preserve original input order among retained entries. Preserve distinct parallel edges and qualifying self-loops. Inputs are unique by set membership; repeated references are collapsed when the caller constructs the set.
- Never add endpoints, discover new edges, or read graph adjacency. Edges absent from the selection stay absent even if their endpoints are selected.
- Return a fresh protected readonly set, using original references. Empty input or edges-only input yields an empty protected set.
- Expected cost is O(N) time and O(N) output space with one filtering pass and native set membership checks. Do not rebuild membership or scan the input per endpoint.

## Pipeline and compatibility

Service fixtures use ordinary array filtering followed by a native Set of starting nodes, connectedNodes with an event-flow predicate and explicit `'outgoing'` direction, `new Set<GraphElement>([...localModel, ...targets])`, then cleanSelection. Merging places the first occurrence of each reference at its original position. Framework helpers know nothing about service/topic types.

`Node.outgoing`, `incoming`, and `edges` return protected ReadonlySet<Edge> snapshots. `exportDiagram` continues to allow incomplete selections, retains nodes-first formatting and its existing defaults, and never calls cleanup implicitly. `saveDiagram` remains unchanged. This unstable API intentionally changes collection return types. The runtime API adds connectedNodes, cleanSelection, and readonlySet; declaration and exact-runtime-export tests cover them.

## Required contract evidence

- Identity assertions use `toBe` per ordered entry and exact lengths, not structural equality alone.
- Protected results reject set mutation; source sets and elements are not newly frozen by helpers.
- Readonly sets typecheck as inputs; results typecheck as the declared readonly sets. All three direction literals typecheck; omitted or invalid directions are rejected. Predicate parameters expose Edge endpoints; arrays and mixed node/edge sets are not valid traversal starts.
- Unit coverage includes empty/isolated/no-match inputs, edge kinds and properties, missing endpoints in each direction, outgoing/incoming/both modes, incident ordering, shared edges between starts, one-hop cycles, self-loops, repeated starts/targets, parallel edges, equal labels, late-position endpoints, set input uniqueness, and source/adjacency preservation.
- Predicate counts equal direction-selected adjacency-entry counts of unique selected starts, including undefined-target and rejected edges, and do not grow after disconnected graph construction.
- Integration verifies both independently derived service overviews, explicit expected text, persistence, and 100 full pipeline repetitions.

## Shared collection and export contracts

```ts
export function readonlySet<T>(values?: Iterable<T>): ReadonlySet<T>;
export function exportDiagram(elements: Iterable<GraphElement>, startText?: string, endText?: string): string;
```

readonlySet copies references once in insertion order, deduplicates by identity, and exposes size, has, keys, values, entries, iteration, and forEach. The callback's third argument is the protected snapshot, never the backing native set. Snapshots expose no mutation methods. Their elements are neither cloned nor frozen by this utility. The exported Iterable is consumed once; it is not implicitly cleaned or deduplicated.

## Element definition contract

```ts
export type ElementDefinition<Args extends unknown[], T extends ModelElement> = {
  (...args: Args): Readonly<T>;
  readonly is: (value: unknown) => value is T;
};
export function defineElement<Args extends unknown[], T extends ModelElement>(
  constructor: new (...args: Args) => T,
): ElementDefinition<Args, T>;
```

Creation forwards all arguments unchanged, preserves constructor defaults/errors, then shallow-freezes the completed instance. The definition itself is frozen. The guard uses instanceof, matches subclasses and directly constructed instances, and never constructs or freezes anything. It narrows to T rather than promising the recognized instance is frozen. Metamodel modules export only the callable definition at runtime and retain type-only class exports. The core runtime API adds defineElement; ElementDefinition is a type-only export. Domain constructor parameters remain fully inferred.

The example metamodel barrel exposes databaseUsage, eventFlow, and moduleComposition alongside service, module, topic, and database. Its implementation class exports remain type-only. A fixture root barrel supports consumer imports. Short quickstart checks consume fixture exports; dedicated model and metamodel test files own detailed acceptance coverage.

## Set filtering and composition

```ts
export function filterSet<T, S extends T>(values: ReadonlySet<T>, predicate: (value: T) => value is S): ReadonlySet<S>;
export function filterSet<T>(values: ReadonlySet<T>, predicate: (value: T) => boolean): ReadonlySet<T>;
```

filterSet evaluates each value once in insertion order and returns a fresh runtime-protected snapshot. It preserves original references, type-guard narrowing, and unchanged source collections. Predicates receive only the value, must not mutate input collections, and propagate errors unchanged. Empty/no-match selections return fresh protected empty sets. It streams matches into readonlySet without an intermediate array.

unionSet accepts any number of iterable sources and returns a fresh protected set of their inferred combined element types. It consumes sources in argument order, preserves first-occurrence order, and deduplicates by identity. No sources produce ReadonlySet<never>. It does not mutate inputs or clone/freeze their elements. Source iteration errors propagate normally.

The service pipeline uses unionSet([service], modules, relationships), filterSet(localModel, createService.is), connectedNodes(starts, eventFlow.is, 'outgoing'), then cleanSelection(unionSet(localModel, reached)). Cleanup also reuses filterSet with its endpoint-membership predicate.
