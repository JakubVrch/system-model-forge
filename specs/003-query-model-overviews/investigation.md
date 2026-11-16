# Repository Investigation: Model Queries and Selection Cleanup

Date: 2026-11-16. Preliminary findings supporting specification, not a finalized API contract or implementation plan.

## Existing capabilities

- `src/element/node.ts` exposes outgoing, incoming, and incident edges.
- `src/element/adjacency.ts` indexes adjacency by identity and returns frozen snapshots. One-hop queries need no global scan. Getters copy lists, so read each once per visited node.
- `src/element/edge.ts` exposes `from` and `to`, including undefined endpoints. Outgoing traversal can project `to`; a general opposite-endpoint operation is not required for this workflow.
- Array filtering and subclass checks suffice for selecting nodes by author-defined criteria; a wrapper adds little value here.
- `src/export/export-diagram.ts` preserves order within nodes-first output and permits edges with omitted endpoints. Keep cleanup explicit to preserve that behavior.
- `tests/unit/traversal.test.ts` covers adjacency snapshots, parallel edges, cycles, self-loops, and undefined endpoints, but no reusable query pipeline.

## Smallest useful additions to consider during planning

1. An outgoing-target utility accepting selected nodes and an edge predicate, returning defined targets once in first-discovery order. A candidate name is `outgoingTargets(nodes, predicate)`. A single-node primitive composed with ordinary collection operations is also viable if the overview guarantees remain the same.
2. A selection-cleanup utility retaining edges only when both endpoints are present. A candidate name is `retainInternalEdges(elements)`. Build a node-identity membership set once, then filter the input; expected work is linear in selection size with ordinary set lookup assumptions.
3. Stable identity-based merging can use existing set/array facilities. Add a merge utility only if the example demonstrates a concrete need.

Framework utilities operate on generic nodes and edges. Service, module, topic, and database specializations belong only to the integration test case. Names are provisional. The traversal predicate should receive the edge so callers can inspect edge kind and destination. Target type-guard inference, a separate target predicate, and a general opposite-endpoint helper are planning choices. No query language or registry is needed.

## Integration test case arrangement

- A shared vocabulary defines service, module, topic, database, and relationship specializations.
- An infrastructure/topics folder exports topic instances and their collection; a separate databases folder does the same for databases.
- Two service folders import infrastructure and export service node, module collection, complete local element collection, and derived event overview.
- Include a shared topic, a topic specific to each service, unrelated infrastructure, module links, database links, and parallel event edges to make deduplication observable.
- Each service derives its overview using reusable operations. Infrastructure does not import services, avoiding circular dependencies.
- Expand `tests/integration/quickstart.test.ts` to verify exact members and identities, excluded databases and dangling edges, independent expected diagram strings, deterministic repetition, unchanged adjacency, and file round trips.

## Current gaps and impacted files

The current quickstart constructs its model inside one test. Its selection filter accepts every input element; it discovers no targets and removes no incomplete edges. Expected text comes from the same exporter under test, proving repeatability but not correctness against an independent expectation.

Implementation should export chosen helpers from `src/index.ts`, update `tests/unit/public-surface.test.ts` because it asserts the exact runtime export list, and extend `tests/type/declarations.test-d.ts` where useful for public typing checks. Focused utility tests should cover readonly inputs and missing endpoints while retaining existing primitive and export contracts.

## Efficiency validation

- Count predicate evaluations over selected outgoing edges; disconnected infrastructure must add none.
- Visit each selected node once and collect targets with a stable identity set. Work scales with selected nodes and outgoing edges, not the whole graph.
- Review cleanup for one membership-building pass and one filtering pass; avoid per-edge searches through the full selection.
- Prefer operation counts and algorithm review over machine-dependent wall-clock assertions.

## Scope boundary

`specs/999-governed-model-partitions/spec.md` describes broader ownership and composition. Ordinary source folders and imports support this example today; implementing that broader feature would unnecessarily expand this request.
