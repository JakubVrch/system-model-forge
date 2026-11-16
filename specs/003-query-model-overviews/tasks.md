# Tasks: Model Queries and Selection Cleanup

**Input**: Design documents in `specs/003-query-model-overviews/`.
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/query-selection-contract.md`, and `quickstart.md`.
**Tests**: Required by FR-009/FR-010 and the constitution. Write behavioral tests and observe failures before implementing their behavior.
**Organization**: User stories are independently testable increments. All paths are repository-relative. `[P]` indicates work on distinct files that can overlap after its prerequisites are complete; it does not authorize skipping dependencies.

## Phase 1: Setup

**Purpose**: Confirm the existing TypeScript/Vitest environment; no new dependencies or scaffold are needed.

- [X] T001 Verify Node.js >=24 and installed lockfile dependencies using `package.json` and `package-lock.json`; run the existing `npm run typecheck`, `npm test`, and `npm run build` baseline and record any pre-existing failures in `specs/003-query-model-overviews/quickstart.md` before feature edits.

## Phase 2: Foundational Review

**Purpose**: Confirm the existing primitives support the shared contracts before story work.

- [X] T002 Inspect `src/element/node.ts`, `src/element/edge.ts`, `src/element/adjacency.ts`, and `src/export/export-diagram.ts` against `specs/003-query-model-overviews/contracts/query-selection-contract.md`; preserve existing frozen adjacency snapshots, the existing `GraphElement` import paths through compatibility re-exports, and endpoint constraints `from: Node | undefined` and `to: Node | undefined`. Confirm the helpers need no changes to graph construction or export semantics.

**Checkpoint**: Existing core primitives are the foundation. No new graph registry, merge abstraction, or runtime dependency is required.

## Phase 3: User Story 1 — Discover Connected Nodes (P1, MVP)

**Goal**: Discover original adjacent nodes through predicate-accepted edges in an explicit direction.
**Independent test**: A graph with incoming/outgoing edges of different kinds reaching equal-type nodes returns exactly the accepted opposite endpoints in each direction, in first-discovery order, with no second hop or mutation.

### Tests first

- [X] T003 [P] [US1] Add failing contract tests in `tests/unit/connected-nodes.test.ts` for required outgoing/incoming/both traversal, edge subclass/property/endpoint predicates evaluated before a hop, incoming-only/outgoing-only exclusions, interleaved incident registration order in both mode, one-hop cycles, and propagation of the original predicate error.
- [X] T004 [P] [US1] Add failing public typing and runtime-surface assertions in `tests/type/declarations.test-d.ts` and `tests/unit/public-surface.test.ts` for `connectedNodes` exported through `src/index.ts`: ReadonlySet<Node> inputs and ReadonlySet<Node> results, Edge predicate typing, all three direction literals, rejection of missing/invalid directions and mixed node/edge starts, and preservation of all existing exports.
- [X] T005 [US1] Extend `tests/unit/connected-nodes.test.ts` with empty/isolated/all-rejected inputs, undefined opposite endpoints in every direction, repeated starts/targets, equal-label distinct identities, parallel edges, self-loops evaluated once per start, and an edge between two supplied starts evaluated once from each start in both mode. Assert exact lengths and `toBe` per result entry; fresh protected readonly sets on every call; unchanged inputs, object freeze state, and all adjacency snapshots. Count predicates and adjacency reads to prove each unique start's chosen snapshot is read once and disconnected growth adds zero predicate evaluations. Observe failures before T006.

### Implementation

- [X] T006 [US1] Implement `connectedNodes` in `src/query/connected-nodes.ts` and export it from `src/index.ts` with required direction `'outgoing' | 'incoming' | 'both'`; use the corresponding existing snapshot, apply the predicate before opposite-endpoint resolution, skip undefined endpoints, rely on unique set starts and deduplicate reached results by identity in stable order, return fresh protected readonly sets, and propagate callback exceptions. Keep expected work O(S + A) with no global scan or recursive expansion.
- [X] T007 [US1] Run the connected-node, public-surface, and declaration checks using `tests/unit/connected-nodes.test.ts`, `tests/unit/public-surface.test.ts`, and `tests/type/declarations.test-d.ts`; resolve story regressions and verify the `src/index.ts` declaration build exposes the documented signature.

**Checkpoint**: US1 is independently usable as the first MVP increment.

## Phase 4: User Story 2 — Produce a Self-Contained Selection (P1)

**Goal**: Explicitly remove edges with absent or undefined endpoints while preserving the ordered selection's nodes and original references.
**Independent test**: A mixed selection with nodes after their edges retains exactly all node entries and edges with two included endpoints, without adding elements or modifying source state.

### Tests first

- [X] T008 [P] [US2] Add failing tests in `tests/unit/clean-selection.test.ts` for empty and edges-only inputs, omitted/undefined source and target endpoints, edges preceding nodes, isolated nodes, qualifying self-loops, parallel edges, repeated references collapsed at set construction, and equal-label distinct endpoint identities. Assert original retained order with `toBe`, no synthesized endpoints/edges, fresh frozen output sets, ReadonlySet inputs, and unchanged source collections/elements/adjacency. Also author the native Set-merge/export repetition scenario described in T011 and observe failures before T010.
- [X] T009 [P] [US2] Extend `tests/type/declarations.test-d.ts` and `tests/unit/public-surface.test.ts` with failing assertions for the `cleanSelection(elements: ReadonlySet<GraphElement>): ReadonlySet<GraphElement>` public contract and the exact runtime surface adding the two helpers plus the readonlySet collection utility; coordinate these shared files after T004/T006.

### Implementation

- [X] T010 [US2] Implement `cleanSelection` in `src/query/clean-selection.ts` and export it from `src/index.ts`: accept a ReadonlySet and filter its insertion-ordered members for nodes or edges with two defined included endpoints, preserve insertion order and identity, and protect only the new result collection. Define `GraphElement` in `src/element/graph-element.ts` and use a type-only import from the element layer in query/export code; retain the old export-module type path as a compatibility re-export; keep expected O(N) work without per-edge array searches or adjacency reads.
- [X] T011 [US2] Run a native Set-merge plus cleanup/export scenario in `tests/unit/clean-selection.test.ts`: merge a local selection with reached references including an already-selected node, assert unique merged references and an independent expected diagram literal over 100 derivations, and verify original collections/adjacency remain unchanged. Run `tests/unit/export-diagram.test.ts` to preserve direct incomplete-selection export compatibility; do not add implicit cleanup to `src/export/export-diagram.ts`.

**Checkpoint**: US2 can be validated using supplied reached references without depending on traversal implementation; shared public-file updates must be serialized with US1.

## Phase 5: User Story 3 — Query Infrastructure and Service Models (P2)

**Goal**: Demonstrate two independently exported service event overviews composed from shared infrastructure through all four query stages.
**Independent test**: Import both services' overview sets, verify exact original members and exclusions, compare independently specified diagram strings and saved contents, and repeat derivation/export 100 times without mutation.

### Tests first

- [X] T012 [US3] Expand `tests/integration/quickstart.test.ts` with failing assertions importing the planned infrastructure and service modules: exact exported sets and per-slot identities, shared/exclusive/unrelated topics, two modules per service, local sets omitting infrastructure nodes, expected retained module/event edges and excluded database edges, shared-topic deduplication across both selected services, frozen fixture exports/fields, and independent literal diagram strings for each service. Keep existing specialization/direct traversal compatibility coverage. Observe missing-fixture or behavioral failures before fixture implementation.

### Metamodel: one element class per file

- [X] T013 [P] [US3] Define `ServiceNode`, `ModuleNode`, `TopicNode`, and `DatabaseNode` in separate files `tests/integration/fixtures/microservice-environment/metamodel/service-node.ts`, `tests/integration/fixtures/microservice-environment/metamodel/module-node.ts`, `tests/integration/fixtures/microservice-environment/metamodel/topic-node.ts`, and `tests/integration/fixtures/microservice-environment/metamodel/database-node.ts`; use `readonly id` and `readonly name` fields, native Node inheritance, and deterministic `System`/`SystemDb` notation from `specs/003-query-model-overviews/data-model.md`.
- [X] T014 [P] [US3] Define `ModuleComposition`, `EventFlow`, and `DatabaseUsage` in separate files `tests/integration/fixtures/microservice-environment/metamodel/module-composition.ts`, `tests/integration/fixtures/microservice-environment/metamodel/event-flow.ts`, and `tests/integration/fixtures/microservice-environment/metamodel/database-usage.ts`; use native Edge inheritance, readonly label fields, a readonly event `kind` distinguishing publish/subscribe, and deterministic endpoint-ID `Rel` notation. Import core classes through `src/index.ts`; use type-only references to domain node types where needed, without importing model instances.

### Infrastructure and independent service exports

- [X] T015 [P] [US3] Create `tests/integration/fixtures/microservice-environment/infrastructure/topics/index.ts` after T013: export original `sharedTopic`, `topicA`, `topicB`, `unrelatedTopic`, and the protected `topics` set; initialize readonly fields and freeze each instance before publishing. Import the topic class directly from its metamodel file.
- [X] T016 [P] [US3] Create `tests/integration/fixtures/microservice-environment/infrastructure/databases/index.ts` after T013: export original `databaseA`, `databaseB`, and the protected `databases` set; freeze authored instances after initialization and import the database class directly from its metamodel file.
- [X] T017 [P] [US3] Create `tests/integration/fixtures/microservice-environment/service-a/index.ts` after both helpers and T013–T016: export `service`, two `modules`, `relationships`, `localModel`, and `eventOverview`; include two module edges, two distinct shared-topic event edges, one topicA event edge, and a databaseA edge. Order local entries as service, modules, module edges, event edges, database edge; omit infrastructure nodes. Derive the overview via ServiceNode filtering, `connectedNodes` with an EventFlow predicate and `'outgoing'`, native identity Set merge, then `cleanSelection`. Freeze authored instances and protect exported sets and preserve imported identities; do not maintain an overview topic list.
- [X] T018 [P] [US3] Create `tests/integration/fixtures/microservice-environment/service-b/index.ts` after both helpers and T013–T016: export `service`, two `modules`, `relationships`, `localModel`, and `eventOverview`; include two module edges, sharedTopic and topicB event edges, and a databaseB edge. Apply the same local ordering, outgoing four-stage pipeline, original infrastructure references, instance freezing and protected set snapshots, and direct per-file metamodel imports as service A; do not import service A or maintain an overview topic list.
- [X] T019 [US3] Complete persistence and repeatability coverage in `tests/integration/quickstart.test.ts`: save both diagrams to separate temporary `.mmd` files, compare read-back UTF-8 contents to the independent expected literals, and clean up in `finally`. After all fixture construction, snapshot all source collections and every involved node's outgoing/incoming/incident adjacency; re-run both full derivations and exports 100 times and assert exact membership/order, byte-identical expected text, unchanged sources/adjacency, and no added database/unrelated nodes. Run the integration suite and resolve failures.

**Checkpoint**: Both independently exported overview sets satisfy the complete end-to-end acceptance criteria.

## Phase 6: Polish and Cross-Cutting Validation

- [X] T020 Reconcile `specs/003-query-model-overviews/quickstart.md` with the implemented paths and commands; document actual validation outcomes and confirm examples use explicit outgoing direction, `cleanSelection`, and the separate-file `metamodel/` layout.
- [X] T021 Run `npm run typecheck`, `npm test`, and `npm run build` from the repository root using `package.json`; inspect emitted `dist/index.d.ts` and helper declarations, verify no new dependencies or unintended exports, and record final results in `specs/003-query-model-overviews/quickstart.md`. Review `src/query/connected-nodes.ts` for local O(S + A) traversal and `src/query/clean-selection.ts` for single-pass O(N) cleanup; resolve failures before marking completion.

- [X] T022 Align graph collections with ReadonlySet snapshots via `src/collection/readonly-set.ts`; update `src/element/node.ts`, `src/element/adjacency.ts`, query helpers, fixture exports, and tests. Broaden `src/export/export-diagram.ts` to Iterable inputs. Validate snapshot isolation and runtime mutation protection in `tests/unit/readonly-set.test.ts`, and set/generator export in `tests/unit/export-diagram.test.ts`.

- [X] T023 Implement the approved defineElement extension in `src/element/define-element.ts`, export its API through `src/index.ts`, and migrate all seven fixture metamodel types and their consumers to callable definitions and .is guards. Add failing runtime/declaration coverage in `tests/unit/define-element.test.ts` and `tests/type/define-element.test-d.ts` before implementation; preserve domain parameters, centralized shallow freezing, adjacency, diagram expectations, and public runtime/type-only export boundaries. Update README and feature contracts; validate typecheck, tests, and build.

- [X] T024 Rename example relationships to DatabaseUsage, EventFlow, and ModuleComposition with matching files/definitions; add the metamodel and environment indexes; configure @core, @metamodel, and @fixtures aliases in `tsconfig.json` and `vitest.config.ts`. Reduce `tests/integration/quickstart.test.ts` to fixture-export smoke checks and preserve detailed acceptance in `tests/integration/microservice-environment.test.ts` and `tests/integration/metamodel.test.ts`. Export both overview diagrams to `artifacts/diagrams/` and validate typecheck, tests, and build.

- [X] T025 Add typed filterSet in `src/query/filter-set.ts`, export it from `src/index.ts`, and use it in both service fixtures, integration re-derivation, and `src/query/clean-selection.ts`. Write failing unit/declaration coverage for ordering, identity, snapshots, predicate errors, and guard narrowing in `tests/unit/filter-set.test.ts` and `tests/type/filter-set.test-d.ts` before implementation.
- [X] T026 Add inferred heterogeneous unionSet in `src/collection/union-set.ts`, export it from `src/index.ts`, and use it for local-model and reached-topic composition in both fixtures and integration re-derivation. Write failing unit/declaration coverage in `tests/unit/union-set.test.ts` and `tests/type/union-set.test-d.ts`; validate all collection changes with typecheck, tests, build, and unchanged diagram output.

## Dependencies and Execution Order

```text
T001 → T002
           ├→ US1: T003 + T004 → T005 → T006 → T007
           └→ US2: T008 + T009 → T010 → T011
T006 → T009 / T010
US1 + US2 → US3: T012 → T013 + T014 → T015 + T016 → T017 + T018 → T019
US1 + US2 + US3 → T020 → T021
```

US1 and US2 algorithms are independent. T009 follows US1's shared public-test changes; T010's `src/index.ts` edit follows T006. A sequential implementation can simply follow task IDs. For overlapping work, serialize all edits to `src/index.ts`, `tests/type/declarations.test-d.ts`, and `tests/unit/public-surface.test.ts`. US3's fixture and integration work depends on both completed helper contracts. T012 precedes fixture implementation to establish failing acceptance coverage. All tests for an operation precede its implementation.

## Parallel Examples by Story

- **US1**: After T002, T003 can run alongside T004 because the unit suite and public contract tests occupy different files. T005 extends T003's file afterward.
- **US2**: After foundational review and US1 shared-file updates, T008 can run alongside T009. T010 waits for both failing test sets and T006's entry-point edit.
- **US3**: After T012, T013 and T014 can be authored independently using the specified types. After the metamodel, T015 and T016 can run together. Once both infrastructure modules and both helpers exist, T017 and T018 can run together; T019 follows both.

## Implementation Strategy

Deliver US1 as the smallest MVP: all three directions, deterministic identity semantics, immutable result containers, public typing, and focused tests. Add US2 as the independent explicit cleanup increment. Then deliver US3 to demonstrate native selection/merge and end-to-end composition, diagram persistence, and repeated-run stability. Do not stop at the MVP when executing the entire feature. Keep domain types in the test metamodel and leave existing direct graph/export behavior intact.

## Coverage and Format Audit

| Requirements | Tasks |
| --- | --- |
| FR-001, FR-007 | T011, T012, T017–T019 |
| FR-002, FR-003 | T003–T007 |
| FR-004 | T008–T011 |
| FR-005, FR-010 | T005, T008, T011, T012, T019 |
| FR-006, FR-008 | T012–T018 |
| FR-009 | T012, T019 |
| FR-011 | T005, T006, T010, T021 |
| FR-012 | T004, T009, T011, T021 |
| SC-001–SC-003 | T005, T008, T011, T012, T017–T019 |
| SC-004–SC-006 | T005, T011, T019–T021 |

26 tasks total: US1 has 5, US2 has 4, US3 has 8, and setup/foundation/polish have 9. Every task has an unchecked checkbox, sequential ID, concrete file paths, and a story label when in a story phase. Tasks remain uncompleted until implementation supplies the required evidence.
