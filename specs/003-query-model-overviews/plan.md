# Implementation Plan: Model Queries and Selection Cleanup

**Branch**: `003-query-model-overviews` | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Input**: `specs/003-query-model-overviews/spec.md`

## Summary

Add two public, domain-independent helpers: `connectedNodes(nodes, predicate, direction)` for one edge-filtered hop in the outgoing, incoming, or both directions, and `cleanSelection(elements)` for explicit selection cleanup. Use native array filtering and identity-based `Set` merging to compose them. Expand the existing quickstart into two independently exported service models sharing topics and databases, with independently verified event overview diagrams and saved files.

The prerequisite script resolves this feature and branch. The specification's branch header still describes its earlier creation on `main`; it is historical metadata, not the active-feature selector. The preliminary `investigation.md` is supporting evidence; the API decisions below and in `contracts/query-selection-contract.md` are the planning output.

## Technical Context

**Language/Version**: TypeScript ^5.8.3, strict NodeNext modules, ES2023 target; Node.js >=24.

**Primary Dependencies**: Existing `Node`, `Edge`, and `GraphElement` APIs; native arrays and sets; no new runtime dependencies.

**Storage**: In-memory graph references; existing UTF-8 diagram persistence through `saveDiagram`.

**Testing**: Vitest ^3.2.4 runtime and declaration tests, TypeScript typecheck and declaration build.

**Target Platform**: Node.js ESM library on the existing supported runtime.

**Project Type**: Core library with executable integration examples.

**Performance Goals**: Traversal O(S + A) expected work for S supplied start references and A direction-selected adjacency entries of unique starts; cleanup O(N) expected work for N selection entries. Disconnected graph growth adds zero predicate calls. Stable output over 100 full derivation/export repetitions.

**Constraints**: Preserve reference identity, deterministic order, source collections, and adjacency. Accept readonly inputs and return fresh frozen readonly result arrays. No recursive traversal, global registry, query language, endpoint synthesis, implicit export cleanup, or partition governance. Predicates must not mutate the graph while querying.

**Scale/Scope**: Two reusable helpers; one test-only metamodel, two infrastructure folders, two service folders; unit, declaration, public-surface, and integration coverage. No change to the existing exporter or graph construction semantics.

## Constitution Check

Gate evaluated before research and again after design against constitution v1.1.0.

| Principle / constraint | Pre-research assessment | Post-design evidence |
| --- | --- | --- |
| I. Model-as-Source | PASS: source-defined model and queries | Fixture modules own models; diagrams are derived outputs |
| II. Graph-First | PASS: existing nodes, edges, runtime adjacency | Helpers use `Node.outgoing`, `Node.incoming`, or `Node.edges` and original `Edge` endpoints |
| III. Package-Bounded Composition | PASS: explicit TypeScript module exports | Infrastructure imports only metamodel; services import infrastructure; public helpers exported by `src/index.ts` |
| IV. Immutable Shared Exports | PASS: preserve shared references and existing readonly boundaries | Freeze new result arrays and fixture export arrays; freeze fixture instances after construction, with readonly domain fields. Helpers neither freeze nor mutate caller-owned objects. Existing adjacency remains controlled by edge construction, never changed by queries |
| V. Deterministic, Validateable Builds | PASS: ordered selection and existing textual export | Identity sets, stable order, independent expected text, 100 repetitions, saved-file assertions |
| VI. Host-Language First | PASS: arrays, sets, native modules | No custom selection/merge DSL, dependencies, module system, or testing framework |
| MVP and workflow | PASS: bounded core-library extension | Failing behavioral tests precede implementation; validate composition, immutability, declarations, and textual exports |

No constitution exception is required. Existing graph construction remains supported; this feature does not introduce package ownership enforcement or promise protection from arbitrary mutating callbacks. Shared fixture exports are immutable after assembly, and query operations introduce no mutation capability.

## Project Structure

### Documentation (this feature)

```text
specs/003-query-model-overviews/
├── spec.md
├── investigation.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── query-selection-contract.md
```

`tasks.md` is a later `speckit-tasks` output, not part of this stage.

### Source Code (repository root)

```text
src/
├── index.ts                              # Export both helpers
├── element/                              # Reuse existing node/edge/adjacency APIs
├── query/
│   ├── connected-nodes.ts               # New one-hop query
│   └── clean-selection.ts           # New explicit cleanup
└── export/export-diagram.ts              # Existing export behavior retained

tests/
├── unit/
│   ├── connected-nodes.test.ts           # New behavioral/complexity coverage
│   ├── clean-selection.test.ts      # New cleanup coverage
│   └── public-surface.test.ts             # Extend exact export list
├── type/declarations.test-d.ts            # Add public API typing coverage
└── integration/
    ├── quickstart.test.ts                 # Expand existing executable guide
    └── fixtures/microservice-environment/
        ├── metamodel/                    # One test-only element class per file
        │   ├── service-node.ts
        │   ├── module-node.ts
        │   ├── topic-node.ts
        │   ├── database-node.ts
        │   ├── module-relationship.ts
        │   ├── event-relationship.ts
        │   └── database-relationship.ts
        ├── infrastructure/
        │   ├── topics/index.ts
        │   └── databases/index.ts
        ├── service-a/index.ts
        └── service-b/index.ts
```

**Structure Decision**: Keep the single-library layout and add a small `query` directory. Reuse the public `GraphElement` type with a type-only import from its existing declaration location; do not relocate it or create a second union. Fixtures import the public package entry using repository-relative `.js` ESM paths. Both services derive and export their own overview; the integration test independently checks the results.

## Phase 0: Research Outcomes

Resolved local design questions in [research.md](research.md): API shape, predicate timing, repeat-start semantics, frozen snapshots, cleanup order and complexity, native merging, fixture composition, and independent export validation. No unresolved clarification remains and no new dependency requires external technology selection.

## Phase 1: Design and Validation

The [data model](data-model.md) defines existing graph entities and fixture exports. The [public contract](contracts/query-selection-contract.md) specifies exact signatures and behavior. The [quickstart](quickstart.md) provides commands and end-to-end assertions for implementation validation.

Implementation should begin with failing focused tests, add the two helpers and public exports, then assemble the integration fixture and verify both service diagrams. Preserve the existing primitive traversal/export tests and direct incomplete-selection export behavior.

| Requirements | Design / validation |
| --- | --- |
| FR-001, FR-007 | Native filter, stable Set merge, four-stage service pipeline |
| FR-002, FR-003, FR-011 | Edge predicate before hop, unique starts/targets, local adjacency, predicate-count tests |
| FR-004 | Two-pass identity membership cleanup, input-order and parallel-edge tests |
| FR-005, FR-010 | Frozen snapshots, source/adjacency preservation, complete edge-case matrix |
| FR-006, FR-008 | Independently exported service folders, shared and exclusive topics, unrelated infrastructure |
| FR-009 | Exact reference membership, independent diagram literals, file round trips, 100 full pipeline runs |
| FR-012 | Existing APIs unchanged; cleanup called explicitly |
| SC-001–SC-003 | Exact ordered results and edge-derived topics, without a maintained overview target list |
| SC-004–SC-006 | Repetition, disconnected predicate counts, two runnable saved overviews |

## Complexity Tracking

No violations or additional architectural layers requiring justification.
