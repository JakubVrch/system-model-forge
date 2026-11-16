# Research: Model Queries and Selection Cleanup

**Date**: 2026-11-16

Research is grounded in the current repository, including `src/element/node.ts`, `src/element/adjacency.ts`, `src/element/edge.ts`, `src/export/export-diagram.ts`, `tests/unit/traversal.test.ts`, `tests/integration/quickstart.test.ts`, and the preliminary feature investigation. A delegated research pass assessed query API semantics and test coverage. No external dependency or version change is proposed.

## 1. Public query shape and filtering

**Decision**: Add `connectedNodes(nodes: readonly Node[], predicate: (edge: Edge) => boolean, direction: 'outgoing' | 'incoming' | 'both'): readonly Node[]` as a standalone package export. Direction is required. Read each unique start's matching adjacency snapshot once, evaluate the predicate before resolving the opposite endpoint, and collect defined reached nodes once by identity.

**Rationale**: Existing adjacency indexes all three modes. Outgoing follows `to`, incoming follows `from`, and both uses incident edges and the endpoint opposite the current start. Preserve each snapshot's registration order. Both mode evaluates a self-loop once per start; an edge joining two selected starts is evaluated for each start. No reached-node adjacency is expanded automatically. Service event examples explicitly choose outgoing traversal.

**Alternatives considered**: Outgoing-only support does not satisfy the revised requirement. Three separate helpers duplicate one traversal policy; a required direction argument keeps behavior explicit. A Node method changes the primitive surface unnecessarily. Generic target-narrowing overloads imply guarantees an edge predicate cannot provide. Multi-hop search and global graph scans exceed scope.

## 2. Identity, repetitions, and readonly boundaries

**Decision**: Deduplicate starting references in first-occurrence order and deduplicate reached references in first-discovery order. Return a fresh frozen array, including for empty results. Keep original object references and never freeze caller elements. Require nonmutating predicates; propagate callback exceptions without wrapping them.

**Rationale**: Repeated starts should not repeat adjacency reads or callback work. Frozen containers match the existing adjacency snapshot convention. Querying must neither clone identities nor change an author's objects. The helper cannot prevent arbitrary user callback side effects.

**Alternatives considered**: Label/identifier equality wrongly collapses distinct nodes; freezing input objects changes caller state; mutable result containers weaken the established snapshot convention. Re-evaluating repeated starts adds work without new results.

## 3. Explicit selection cleanup

**Decision**: Add `cleanSelection(elements: readonly GraphElement[]): readonly GraphElement[]`. First build a set of all selected node identities; then filter the original sequence, retaining every node entry and each edge whose defined endpoints both belong to that set. Freeze the fresh output array.

**Rationale**: This preserves arbitrary mixed ordering, isolated nodes, self-loops, and distinct parallel edges in expected O(N) time. Cleanup does not deduplicate input entries; stable identity merging is a separate explicit native operation. Later node positions must satisfy earlier edges.

**Alternatives considered**: Repeated `includes` scans can be quadratic; a streaming one-pass filter incorrectly drops edges preceding their nodes; automatic exporter cleanup breaks intentional incomplete exports; endpoint insertion expands scope unexpectedly.

## 4. Native selection and merge

**Decision**: Select services using ordinary `Array.filter` and subclass checks. Merge local elements followed by discovered targets using `[...new Set<GraphElement>([...localModel, ...targets])]`.

**Rationale**: Native language operations preserve insertion order and reference identity, including targets already in the local selection. Only traversal and graph-boundary cleanup justify reusable helpers.

**Alternatives considered**: A custom query builder, selection object, or merge utility duplicates host-language functionality without solving an additional requirement.

## 5. Integration composition and immutable exports

**Decision**: Place test-only metamodel and model modules under `tests/integration/fixtures/microservice-environment`. The `metamodel/` folder contains one node or relationship class per file, imported directly by consumers. Infrastructure exports topics/databases; service folders import those originals and independently export local arrays and derived overviews. Freeze authored fixture instances after their fields are initialized and freeze exported arrays. Construct all fixture edges before capturing validation snapshots.

**Rationale**: Ordinary ESM dependencies demonstrate composition without circular imports or partition governance. Domain fields are readonly; frozen fixtures and result containers provide runtime protection for these shared exports. Edge construction still owns adjacency registration, as it does today; this feature does not change that primitive behavior.

**Alternatives considered**: Moving domain metamodel into the core would make generic helpers domain-specific. Governed partitions are a separate specification. Whole-model registries or discovery introduce unnecessary coupling.

## 6. Reliable validation and existing contracts

**Decision**: Extend the exact runtime export test and declaration tests. Unit tests cover the edge cases and predicate counts. Integration tests assert reference-by-reference ordered membership, literal expected diagram strings, saved UTF-8 contents, and 100 complete re-derivation/export runs. Use the existing `exportDiagram`/`saveDiagram` APIs unchanged and temporary directories cleaned in `finally`.

**Rationale**: The current quickstart computes expected text through the exporter itself; literal expectations catch exporter or membership errors independently. Operation counts prove local traversal without timing instability. Code review of the two cleanup passes establishes proportional work. Existing exporter tests preserve incomplete-selection compatibility.

**Alternatives considered**: Timing thresholds are machine-dependent; generated expectations hide regressions; snapshots captured before all edges are constructed confuse setup mutation with query mutation.

## Resolved Technical Questions

All planning unknowns are resolved: signatures, all three direction modes and their ordering, predicate timing, missing-endpoint behavior, duplicate starts, output mutability, duplicate cleanup entries, type placement, fixture ownership, performance bounds, and compatibility. No open clarification remains.
