# Tasks: Define Model Partitions

**Input**: Design documents in `specs/004-define-model-partitions/`: spec.md, plan.md, research.md, data-model.md, contracts/partition-contract.md, and quickstart.md.

**Prerequisites**: Approved six-partition layout in plan.md; existing TypeScript core and test tooling.

**Tests**: Included to implement the spec's acceptance scenarios and the constitution's requirement to add failing behavior and immutability tests before implementation. Preserve existing tests and expected diagram text.

**Organization**: Tasks are grouped by user story. All paths are repository-relative. `[P]` identifies tasks that may run together within the indicated dependency wave; it does not authorize skipping prerequisites. No implementation is performed by generating this list.

## Phase 1: Setup

**Purpose**: Establish the existing behavior and migration inventory without introducing new dependencies.

- [ ] T001 Run the existing `package.json` scripts `npm run typecheck`, `npm test`, and `npm run build`; record baseline results and any pre-existing failures in `specs/004-define-model-partitions/quickstart.md`.
- [ ] T002 Inventory consumers of `tests/integration/fixtures/microservice-environment/index.ts`, its infrastructure/service barrels, and `@metamodel`; record affected source/test imports and `tsconfig.json`/`vitest.config.ts` alias changes in `specs/004-define-model-partitions/quickstart.md` before moving files.

## Phase 2: Foundational — Publication Protection

**Purpose**: Provide the shared protection mechanism needed by element and diagram publication. Complete before story implementation.

- [ ] T003 Add failing tests in `tests/unit/protect-published-data.test.ts` for nested records/arrays, cycles, shared aliases, symbol/non-enumerable properties, already-frozen parents, endpoint references, untouched prototypes, and getters never invoked; verify unsupported Map/Set/Date/typed-array/custom metadata instances and own accessors produce a path-bearing TypeError before any supported object is frozen.
- [ ] T004 Implement preflight and in-place freezing in `src/partition/protect-published-data.ts` using descriptor inspection and visited-object tracking; support primitives, plain/null-prototype records, arrays, and Node/Edge own state; reject unsupported payloads, follow endpoints without walking adjacency, and keep existing `src/element/define-element.ts` shallow behavior unchanged. Satisfy the data-model rule: “Unsupported mutable payloads fail with a path-bearing TypeError before the freezing phase; no partition value is returned.”

**Checkpoint**: Protection tests pass and existing element/traversal behavior remains unchanged. The helper handles all publication roots in one preflight before freezing, rather than freezing one export before validating later exports.

## Phase 3: User Story 1 — Publish and Consume a Partition (P1, MVP)

**Goal**: Publish identity, named element sets, and reusable definitions through a typed immutable contract. Empty diagram groups are supported in this increment.

**Independent Test**: Publish two overlapping named element sets and a callable metamodel definition; consume exact keys and concrete types, construct a new element, mutate original containers and published values, and verify stable identities, membership, order, and definition behavior.

### Tests first

- [ ] T005 [P] [US1] Add failing runtime tests in `tests/unit/define-partition.test.ts` for required groups, empty groups/sets, native Set and readonlySet input snapshots, overlapping sets, distinct same-ID instances, exact id/name preservation, safe special keys, absent/inherited keys, source-map edits, and mutation attempts on partition/mappings/elements/definition surfaces; include a later invalid export proving publication-wide preflight.
- [ ] T006 [P] [US1] Add failing type tests in `tests/type/partition.test-d.ts` for required fields, exact keys/member subtypes, readonly outputs even from native Set inputs, broad default `Partition` annotation, heterogeneous metamodel argument tuples, return types, and `.is` narrowing; reject absent groups, non-string id/name, arrays as element collections, and non-definition metamodel entries.

### Implementation

- [ ] T007 [US1] Define generic `Partition` and `PartitionDiagram` contracts and the `definePartition` signature in `src/partition/define-partition.ts`; preserve inference and enforce the data-model constraints “Required; zero or more own string-keyed collections of GraphElement”, “Required; zero or more own string-keyed PartitionDiagram values”, and “Required; zero or more existing callable ElementDefinition values”. Return readonly set types rather than leaking mutable input methods.
- [ ] T008 [US1] Implement element/metamodel publication in `src/partition/define-partition.ts`: copy own enumerable string-keyed mappings with no inherited lookup, snapshot every element set using `readonlySet`, collect all own-data roots for preflight, freeze supported state and definition/guard surfaces without replacing references, then freeze result mappings and shell; preserve “Keys are case-sensitive and receive no normalization” and “Empty strings are not additionally prohibited by this feature.” Do not inspect callable intrinsic properties or freeze class prototypes.
- [ ] T009 [US1] Export `definePartition`, `Partition`, and `PartitionDiagram` through `src/index.ts`; verify the public imports in `tests/type/partition.test-d.ts` retain definition signatures and that construction through exported definitions keeps existing `defineElement` semantics until an instance is published.
- [ ] T010 [US1] Extend `tests/unit/define-partition.test.ts` with fresh-node composition checks: create an edge to a published node and verify new adjacency is visible while old adjacency snapshots, element fields, and partition membership remain unchanged; verify edge endpoint protection does not expand exported membership and undefined endpoints remain supported.

**Checkpoint**: US1 passes runtime/type tests with empty diagrams; the core API is usable without any fixture migration. No registry, loader, namespace rewriting, or hierarchy field is introduced.

## Phase 4: User Story 2 — Publish Named Diagrams (P1)

**Goal**: Publish immutable diagram selections and exact authored text alongside elements.

**Independent Test**: Publish two diagrams with distinct selections/text, including diagram-only and imported elements; mutate source containers and returned records and verify exact immutable results, then exercise existing export/save capabilities.

### Tests first

- [ ] T011 [P] [US2] Extend `tests/unit/define-partition.test.ts` with failing tests for two independent diagrams, diagram-only element protection, foreign members, empty selection/text, exact whitespace, missing keys, caller-owned record/set mutation, and reflective mutation attempts; prove no implicit cleanup, endpoint completion, or text regeneration occurs.
- [ ] T012 [P] [US2] Extend `tests/type/partition.test-d.ts` with failing tests for diagram key/member inference, readonly `data` and `inNotation`, missing diagram members, array data, non-string text, and exclusion of Set mutator methods from diagram results.

### Implementation

- [ ] T013 [US2] Complete diagram publication in `src/partition/define-partition.ts`: copy/freeze records, snapshot `data`, include diagram-only elements in the same publication-wide preflight as element exports, and preserve the data-model rules “Immutable membership snapshot, preserving member subtypes, references, and order” and “Exact author-supplied textual representation, including whitespace or empty text”.
- [ ] T014 [US2] Add a small API-level scenario within `tests/integration/microservice-environment.test.ts` using local test-created elements and two published diagrams; compare regenerated text with supplied text, save supplied `inNotation` using `saveDiagram`, verify file contents, and clean temporary files. This scenario must not require the forthcoming fixture migration or introduce `partition.test.ts`.

**Checkpoint**: US1 and US2 pass independently of the nested example; all publication input roots are validated before freezing.

## Phase 5: User Story 3 — Navigate a Consistent Partition Folder (P2)

**Goal**: Adapt the existing model to root → databases/topics/services → service A/B, with the services metamodel owned by services and explicit public entry imports.

**Independent Test**: Load all six entry files in the existing integration test; verify each identity/group, cross-partition reference equality, shared metamodel definitions, root/services/child diagram equivalence, and byte-identical existing A/B outputs.

### Tests first

- [ ] T015 [US3] Add failing six-partition acceptance scenarios to `tests/integration/microservice-environment.test.ts` using the planned entry paths from `specs/004-define-model-partitions/plan.md`; preserve the existing expectedA/expectedB strings and assert singleton/aggregate memberships, all six identities, shared topic/definition references, root/services/child diagram equality, immutable exports, and 100 stable reads.

### Infrastructure and shared vocabulary

- [ ] T016 [P] [US3] Move the database definition and instances into `tests/integration/fixtures/microservice-environment/partitions/databases/metamodel/database-node.ts` and `elements/index.ts`; add `metamodel/index.ts`, empty `diagrams/index.ts`, and `databases.partition.ts` in that partition folder; expose `databaseA`, `databaseB`, and `databases` sets, the `database` definition, and a type-only DatabaseNode export without changing instance IDs or notation.
- [ ] T017 [P] [US3] Move the topic definition and instances into `tests/integration/fixtures/microservice-environment/partitions/topics/metamodel/topic-node.ts` and `elements/index.ts`; add `metamodel/index.ts`, empty `diagrams/index.ts`, and `topics.partition.ts` in that folder; publish singleton `sharedTopic`, `topicA`, `topicB`, `unrelatedTopic` and aggregate `topics` sets, plus `topic` and its type-only TopicNode export, preserving order and identity.
- [ ] T018 [US3] Move the five shared service definitions into `tests/integration/fixtures/microservice-environment/partitions/services/metamodel/service-node.ts`, `module-node.ts`, `module-composition.ts`, `event-flow.ts`, and `database-usage.ts`; create the sibling `index.ts` barrel independent of services assembly, preserve callable/type identities, and use type-only infrastructure endpoint imports through leaf partition entry files.

### Service children and parent assembly

- [ ] T019 [P] [US3] Refactor service A into `tests/integration/fixtures/microservice-environment/partitions/services/partitions/service-a/`: create `metamodel/index.ts`, `elements/service.ts`, `elements/modules.ts`, `elements/relationships.ts`, `elements/index.ts`, `diagrams/event-overview.ts`, and `service-a.partition.ts`; reuse the services metamodel and infrastructure entry exports, preserve all current edges/order and the select → traverse → union → clean pipeline, and publish the four element groups plus `eventOverview` with current text boundaries.
- [ ] T020 [P] [US3] Refactor service B into `tests/integration/fixtures/microservice-environment/partitions/services/partitions/service-b/`: create `metamodel/index.ts`, `elements/service.ts`, `elements/modules.ts`, `elements/relationships.ts`, `elements/index.ts`, `diagrams/event-overview.ts`, and `service-b.partition.ts`; reuse shared definitions/infrastructure, preserve the current B-specific edges/order and query pipeline, and publish the four element groups plus its unchanged `eventOverview` text.
- [ ] T021 [US3] Create `tests/integration/fixtures/microservice-environment/partitions/services/elements/index.ts`, `diagrams/index.ts`, and `services.partition.ts`; aggregate A/B into `services`, `serviceA`, `serviceB`, and `all` sets per plan.md, forward `serviceAEvents`/`serviceBEvents` data/text, and publish the five shared definitions without importing parent assembly from child modules.
- [ ] T022 [US3] Create root assembly in `tests/integration/fixtures/microservice-environment/microservice-environment.partition.ts` with `elements/index.ts`, `diagrams/index.ts`, and updated `metamodel/index.ts`; publish `all`, `services`, `topics`, and `databases`, combine services-all then topics then databases in first-seen order, expose both service diagrams unchanged, and aggregate all seven public definitions.

### Consumer migration and documentation

- [ ] T023 [US3] Update all fixture consumers identified by T002, including `tests/integration/microservice-environment.test.ts` and `tests/type/define-element.test-d.ts`, to explicit partition entries and `.elements`/`.diagrams`/`.metamodel` access; align or remove obsolete aliases in `tsconfig.json` and `vitest.config.ts`, remove replaced files/barrels under `tests/integration/fixtures/microservice-environment/`, and ensure service children never import root or services assembly. Preserve existing unit/type/query coverage and do not retain duplicate model instances.
- [ ] T024 [US3] Update `README.md` with the recursive `partitions/` convention, all six entry locations, services-owned shared metamodel import example, singleton set consumption, parent aggregation, and empty diagram groups; explain that nesting has no automatic loading or ownership semantics and that definition-only child authoring uses the independent services metamodel barrel.

**Checkpoint**: Existing microservice acceptance test passes with the same expected diagrams using published text; all six partitions follow the convention, services owns shared vocabulary, and root-owned folders are separate from child names.

## Phase 6: Polish & Cross-Cutting Validation

- [ ] T025 Review `src/partition/define-partition.ts` and `src/partition/protect-published-data.ts` against `specs/004-define-model-partitions/contracts/partition-contract.md`; document in `README.md` the supported plain-data/pure-behavior boundary, unsupported payload errors, alias-freezing effects, endpoint protection, and live adjacency; confirm no global change to `defineElement` or arbitrary-object sandbox claim.
- [ ] T026 Run `npm run typecheck`, `npm test`, and `npm run build` using `package.json`; inspect `dist/index.d.ts` and emitted partition declarations for the three public exports, exact key/subtype preservation and metamodel call signatures; resolve regressions and record results in `specs/004-define-model-partitions/quickstart.md` without committing ignored build output.
- [ ] T027 Follow `specs/004-define-model-partitions/quickstart.md` against the implemented paths and commands, verify saved text matches existing expectations and the six-partition tree matches `plan.md`, and update that guide from planned to runnable status with validation evidence.

## Dependencies & Execution Order

```text
Setup T001–T002
  → Foundation T003 → T004
  → US1 (T005 || T006) → T007 → T008 → T009 → T010
  → US2 (T011 || T012) → T013 → T014
  → US3 T015 → (T016 || T017) → T018
             → (T019 || T020) → T021 → T022 → T023 → T024
  → Polish T025 → T026 → T027
```

US2 depends on US1's publication contract; US3 depends on both for the full example. Each story is independently verifiable at its checkpoint, without unfinished later-story functionality. T007 introduces the complete diagram type shape; T013 supplies nonempty diagram publication. Do not treat the US1 checkpoint as completion of the full feature.

Tests precede implementation within each phase. T015 intentionally targets not-yet-created fixture entries and is expected to fail until migration finishes. T016/T017 introduce new locations; obsolete files are removed only after consumer migration in T023. Avoid concurrently editing shared barrels, aliases, or the integration test. An implementation worker must not mark requirements checklist items on behalf of reviewers.

## Parallel Execution Examples

- **US1**: After T004, write runtime publication tests (T005, `tests/unit/define-partition.test.ts`) and type tests (T006, `tests/type/partition.test-d.ts`) in parallel, then implement sequentially.
- **US2**: After T010, write diagram runtime tests (T011) and diagram type tests (T012) in parallel; both complete before T013.
- **US3**: After T015, build databases (T016) and topics (T017) independently. After T018, build service A (T019) and service B (T020) independently. Both children must finish before services assembly (T021).

## Requirement Coverage

| Scope | Tasks |
| --- | --- |
| FR-001–005: identity, named sets, diagrams, metamodel | T005–T009, T011–T014 |
| FR-006–007: runtime immutability, exact identity/text | T003–T005, T008, T010–T013, T025 |
| FR-008–009: empty groups and malformed declarations | T005–T007, T011–T013 |
| FR-010–012: folder convention, native imports, complete example | T015–T024 |
| FR-013: graph/query/export compatibility | T010, T014, T019–T023, T026 |
| SC-001–006: consumer access, exact contents, mutations, repeated reads, type errors, reproducibility | T005–T006, T010–T015, T023–T027 |

## Implementation Strategy

Deliver US1 first as the minimal core publication API with empty diagram groups. Add US2 as a separately verified diagram increment, then migrate the real fixture for US3. Complete all six phases for the user's requested feature. No additional example project, integration test file, loader, registry, or dependency framework is required.

Task summary: 27 tasks — Setup 2, Foundation 2, US1 6, US2 4, US3 10, Polish 3. Eight tasks have parallel markers, arranged in four independent pairs. All tasks start unchecked.
