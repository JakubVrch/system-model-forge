# Research: Model Queries and Selection Cleanup

**Date**: 2026-11-16

Research is grounded in the current repository, including `src/element/node.ts`, `src/element/adjacency.ts`, `src/element/edge.ts`, `src/export/export-diagram.ts`, `tests/unit/traversal.test.ts`, `tests/integration/quickstart.test.ts`, and the preliminary feature investigation. A delegated research pass assessed query API semantics and test coverage. No external dependency or version change is proposed.

## 1. Public query shape and filtering

**Decision**: Add `connectedNodes(nodes: ReadonlySet<Node>, predicate: (edge: Edge) => boolean, direction: 'outgoing' | 'incoming' | 'both'): ReadonlySet<Node>` as a standalone package export. Direction is required. Read each start's matching adjacency snapshot once, evaluate the predicate before resolving the opposite endpoint, and collect defined reached nodes once by identity.

**Rationale**: Existing adjacency indexes all three modes. Outgoing follows `to`, incoming follows `from`, and both uses incident edges and the endpoint opposite the current start. Preserve each snapshot's registration order. Both mode evaluates a self-loop once per start; an edge joining two selected starts is evaluated for each start. No reached-node adjacency is expanded automatically. Service event examples explicitly choose outgoing traversal.

**Alternatives considered**: Outgoing-only support does not satisfy the revised requirement. Three separate helpers duplicate one traversal policy; a required direction argument keeps behavior explicit. A Node method changes the primitive surface unnecessarily. Generic target-narrowing overloads imply guarantees an edge predicate cannot provide. Multi-hop search and global graph scans exceed scope.

## 2. Identity, repetitions, and readonly boundaries

**Decision**: Require ReadonlySet inputs, and deduplicate reached references in first-discovery order. Return a fresh protected readonly set, including for empty results. Keep original object references and never freeze caller elements. Require nonmutating predicates; propagate callback exceptions without wrapping them.

**Rationale**: Set inputs guarantee each start occurs once without query-local bookkeeping. Frozen containers match the existing adjacency snapshot convention. Querying must neither clone identities nor change an author's objects. The helper cannot prevent arbitrary user callback side effects.

**Alternatives considered**: Label/identifier equality wrongly collapses distinct nodes; freezing input objects changes caller state; mutable result containers weaken the established snapshot convention. Re-evaluating repeated starts adds work without new results.

## 3. Explicit selection cleanup

**Decision**: Add `cleanSelection(elements: ReadonlySet<GraphElement>): ReadonlySet<GraphElement>`. Filter the input set in insertion order using its membership checks, retaining every node entry and each edge whose defined endpoints both belong to that set. Return a protected readonly snapshot.

**Rationale**: This preserves arbitrary mixed ordering, isolated nodes, self-loops, and distinct parallel edges in expected O(N) time. Cleanup accepts a ReadonlySet, so uniqueness is established before the call through native Set composition. Later node positions must satisfy earlier edges.

**Alternatives considered**: Repeated `includes` scans can be quadratic; a streaming one-pass filter incorrectly drops edges preceding their nodes; automatic exporter cleanup breaks intentional incomplete exports; endpoint insertion expands scope unexpectedly.

## 4. Native selection and merge

**Decision**: Select services using ordinary `Array.filter` and subclass checks. Merge local elements followed by discovered targets using `new Set<GraphElement>([...localModel, ...targets])`.

**Rationale**: Native language operations preserve insertion order and reference identity, including targets already in the local selection. Only traversal and graph-boundary cleanup justify reusable helpers.

**Alternatives considered**: A custom query builder, selection object, or merge utility duplicates host-language functionality without solving an additional requirement.

## 5. Integration composition and immutable exports

**Decision**: Place test-only metamodel and model modules under `tests/integration/fixtures/microservice-environment`. The `metamodel/` folder contains one node or relationship class per file, imported directly by consumers. Infrastructure exports topics/databases; service folders import those originals and independently export local sets and derived overviews. Freeze authored fixture instances after their fields are initialized and freeze exported sets. Construct all fixture edges before capturing validation snapshots.

**Rationale**: Ordinary ESM dependencies demonstrate composition without circular imports or partition governance. Domain fields are readonly; frozen fixtures and result containers provide runtime protection for these shared exports. Edge construction still owns adjacency registration, as it does today; this feature does not change that primitive behavior.

**Alternatives considered**: Moving domain metamodel into the core would make generic helpers domain-specific. Governed partitions are a separate specification. Whole-model registries or discovery introduce unnecessary coupling.

## 6. Reliable validation and existing contracts

**Decision**: Extend the exact runtime export test and declaration tests. Unit tests cover the edge cases and predicate counts. Integration tests assert reference-by-reference ordered membership, literal expected diagram strings, saved UTF-8 contents, and 100 complete re-derivation/export runs. Use the existing `exportDiagram`/`saveDiagram` APIs unchanged and temporary directories cleaned in `finally`.

**Rationale**: The current quickstart computes expected text through the exporter itself; literal expectations catch exporter or membership errors independently. Operation counts prove local traversal without timing instability. Code review of the cleanup pass establishes proportional work. Existing exporter tests preserve incomplete-selection compatibility.

**Alternatives considered**: Timing thresholds are machine-dependent; generated expectations hide regressions; snapshots captured before all edges are constructed confuse setup mutation with query mutation.

## Resolved Technical Questions

All planning unknowns are resolved: signatures, all three direction modes and their ordering, predicate timing, missing-endpoint behavior, duplicate starts, output mutability, set input uniqueness, type placement, fixture ownership, performance bounds, and compatibility. No open clarification remains.

## 7. Graph element type ownership

**Decision**: Own `GraphElement = Node | Edge` in `src/element/graph-element.ts`. Both query and export layers import it from there; the package entry exports it directly, and the exporter retains a compatibility type re-export.

**Rationale**: Graph element identity is a core concept. Keeping the type in the element layer removes the query layer's dependency on diagram export.

**Alternatives considered**: `ModelElement` only requires notation and could admit subclasses that are neither nodes nor edges; that broader contract does not express cleanup's endpoint semantics.

## 8. Consistent protected set collections

**Decision**: Node adjacency getters, query results, and fixture collections expose ReadonlySet snapshots. The exported readonlySet factory copies an iterable into a private native Set and exposes only read operations on a frozen wrapper. Helpers accept ReadonlySet inputs. Diagram export accepts Iterable<GraphElement>.

**Rationale**: Set uniqueness and insertion order are consistent throughout the graph API. The wrapper never leaks its backing set, including through forEach, so native mutation methods cannot modify returned collections. Queries leave caller-owned sets and element state unchanged. Runtime protection for fixture node fields is provided separately by freezing authored instances.

**Alternatives considered**: Object.freeze on a native Set does not prevent add/delete/clear; TypeScript readonly alone has no runtime protection. Array snapshots would retain an inconsistent collection contract. The general partition interface remains deferred.

## 9. Centralized element definitions

**Decision**: defineElement wraps any concrete ModelElement constructor, forwarding its inferred argument tuple and freezing the completed instance. A frozen callable definition also exposes the generated instanceof-based .is type guard. All seven fixture metamodel modules export definitions at runtime and implementation types only at compile time.

**Rationale**: Consumer modules avoid repeated construction/freezing and separate hand-authored guards. Constructor-owned domain properties, defaults, validation, and adjacency registration remain native TypeScript behavior. Freezing after construction permits subclass fields to initialize normally.

**Alternatives considered**: Factory-only exports would need separately maintained guards. Exporting runtime constructors would retain two competing consumer creation paths. Deep freezing would mutate referenced endpoints and nested caller objects beyond the approved contract. Recognition does not imply that directly constructed instances have been frozen.

## 10. Example naming and import boundaries

**Decision**: Name the relationships DatabaseUsage, EventFlow, and ModuleComposition with callable definitions databaseUsage, eventFlow, and moduleComposition. Add a public metamodel index and fixture-root index, with TypeScript/Vitest @core, @metamodel, and @fixtures aliases. Metamodel implementation files retain direct type-only sibling imports to avoid circular runtime dependencies; consumers use the index.

**Rationale**: Domain names communicate meaning, aliases shorten consumer imports, and the quickstart shows only importing fixture exports and checking basic contents. Detailed model acceptance, persistence, and repeatability coverage belongs in the dedicated model integration suite; definition contracts belong in the metamodel suite.

**Alternatives considered**: Keeping model construction and full validation in the quickstart obscures its consumer example. Replacing relative imports inside emitted core modules with aliases would require an additional runtime loader, so core source remains independently executable after tsc compilation.

## 11. Shared set selection and composition

**Decision**: Add filterSet for typed set filtering and unionSet for composing heterogeneous iterable sources. Both return protected snapshots through readonlySet. Use these utilities in fixture construction, queries, and cleanup.

**Rationale**: Consumers should receive sets directly without repeatedly spreading into arrays and converting back. Generated .is guards retain their inferred narrowing. Combined model types are inferred from source iterables, and underlying native Set semantics preserve identity and insertion order.

**Alternatives considered**: Repeating native array-filter/Set construction obscures the model pipeline and duplicates collection protection. A query DSL or partition abstraction remains unnecessary.
