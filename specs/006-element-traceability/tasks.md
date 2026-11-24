---
description: "Implementation tasks for feature 006 Element Traceability"
---

# Tasks: Element Traceability

**Input**: Design documents in `specs/006-element-traceability/`

**Prerequisites**: [Specification](spec.md), [plan](plan.md), [research](research.md), [data model](data-model.md), [core contract](contracts/core-name.md), [CLI contract](contracts/cli-trace.md), and [quickstart](quickstart.md).

**Tests**: Write focused contract checks before implementation. Use the existing microservice environment for the main CLI integration flows and aim for 85% combined unit and integration coverage.

**Format**: `- [ ] T### [P?] [US#?] Description`. `[P]` identifies tasks that can run together after their prerequisites are complete. Paths are relative to the repository root.

## Phase 1: Setup

- [ ] T001 Verify the Node.js version and available build, typecheck, test, and coverage scripts in `package.json`. Use `tests/integration/cli-setup.ts` and `tests/integration/cli-helpers.ts` as the built CLI test harness.

## Phase 2: Foundational

- [ ] T002 [P] Add failing checks for required readonly constructor names and inferred factory and endpoint types in `tests/type/declarations.test-d.ts`, `tests/type/define-element.test-d.ts`, and `tests/type/edge.test-d.ts`.
- [ ] T003 [P] Add failing checks in `tests/unit/node-edge-creation.test.ts` and `tests/unit/element-info.test.ts` for readonly authored names on both kinds, exclusion from default business snapshots, and no adjacency registration when edge name validation fails. Preserve existing published-object immutability assertions.
- [ ] T004 Require a readonly authored string `name` beside the existing readonly authored string `id` in `src/core/element/model-element.ts`. Append `name` in `src/core/element/node.ts` and `src/core/element/edge.ts`, validate it before adjacency registration, and exclude it from default attribute snapshots. Preserve endpoint types, factory inference, and the ability to construct distinct objects with matching names or IDs.
- [ ] T005 [P] Migrate the remaining unit and declaration test constructors under `tests/unit/` and `tests/type/`, including `tests/unit/traversal.test.ts`, `tests/unit/define-element.test.ts`, and `tests/type/partition.test-d.ts`, to supply explicit names while preserving existing behavior assertions.
- [ ] T006 [P] Migrate existing CLI fixtures and inline test models in `tests/integration/fixtures/cli/`, `tests/integration/cli-elements.test.ts`, `tests/integration/cli-loader.test.ts`, and `tests/integration/cli-package.test.ts`. Keep intentional invalid cases invalid for the intended reason and move any fixture display value from `label` to `name`.

**Checkpoint**. The core contract and existing test callers use first-class names. The service environment migration belongs to US4.

## Phase 3: User Story 4 - Name Model Elements Consistently (P1)

**Goal**. Use the core name for listing and endpoint identity regardless of business-attribute customization or projection. This increment supports the named trace output in US1.

**Independent test**. List a named service edge with an endpoint outside its export. Verify the same authored name in pretty and JSON output, including with `--property name` or another projection.

- [ ] T007 [P] [US4] Add failing listing and endpoint assertions in `tests/unit/cli-inspect.test.ts` and `tests/unit/cli-element-format.test.ts` for an omitted or conflicting custom `name`, generic treatment of authored attributes, and `--property name` compatibility. Add the service fixture listing flow using `tests/integration/cli-elements.test.ts` and `tests/integration/cli-helpers.ts`.
- [ ] T008 [P] [US4] Migrate the service fixture node subclasses in `tests/integration/fixtures/microservice-environment/services/_metamodel/service-node.ts`, `tests/integration/fixtures/microservice-environment/services/_metamodel/module-node.ts`, `tests/integration/fixtures/microservice-environment/databases/_metamodel/database-node.ts`, and `tests/integration/fixtures/microservice-environment/topics/_metamodel/topic-node.ts`. Forward the existing authored names to core.
- [ ] T009 [US4] Migrate the service environment edges in `tests/integration/fixtures/microservice-environment/services/_metamodel/module-composition.ts`, `tests/integration/fixtures/microservice-environment/services/_metamodel/database-usage.ts`, and `tests/integration/fixtures/microservice-environment/services/_metamodel/event-flow.ts`. Update factories in `tests/integration/fixtures/microservice-environment/services/service-a/elements.ts` and `tests/integration/fixtures/microservice-environment/services/service-b/elements.ts` and migrate inline constructions in `tests/integration/microservice-environment.test.ts`. Move display labels to `name` while preserving graph IDs, connection order, and diagram text.
- [ ] T010 [US4] Share canonical identity and existing type extraction through `src/cli/source/graph-element.ts`. Update `src/cli/commands/list-elements/inspect.ts`, `src/cli/result.ts`, `src/cli/source/ipc.ts`, and `src/cli/output/format.ts` so listing and endpoint identity contain “Required strings `id` and `name`.” Preserve endpoint membership, projection, other business attributes, and the supported `--property name` spelling. Remove special handling of `label` and omit a conflicting custom `name` from attributes.

## Phase 4: User Story 1 - See Direct Relationships (P1)

**Goal**. Run a one-hop trace for a published node or edge with readable terminal output.

**Independent test**. Trace Service A and verify the two parallel branches to the shared topic and the imported database endpoint. A focused unit case traces an edge ID and checks direction and missing endpoints.

- [ ] T011 [P] [US1] Add failing direct trace and terminal contract cases in `tests/unit/cli-trace.test.ts` and `tests/unit/cli-trace-format.test.ts`. Cover both directions, an edge root, parallel edges, missing endpoints, a root-only result, stable ordering, and safe rendering of authored strings.
- [ ] T012 [P] [US1] Add the default Service A built CLI flow in `tests/integration/cli-trace.test.ts` via `tests/integration/cli-helpers.ts` and `tests/integration/fixtures/microservice-environment/services/service-a/elements.ts`. Expect distinct IDs on the parallel edges and a database endpoint outside the selected export.
- [ ] T013 [US1] Add trace records in `src/cli/result.ts` and root lookup and direct traversal in `src/cli/commands/trace-element/trace.ts`. Read the union of published element and diagram memberships, match one exact case-sensitive input ID, and preserve each distinct matching object in first-encounter order. The result contract is “A successful result has at least one root,” each leaf follows “An empty array represents a leaf” for `relationships`, JSON uses `null` for unavailable model type, and every branch has `direction` “(`To` or `From`), and exactly one related `element`.” Report the requested ID when there are no matches. Omit missing endpoints and preserve parallel edges. Order branch types ordinally, with `To` before `From` for the same type and authored order for ties. Sort unavailable types as empty strings.
- [ ] T014 [US1] Add terminal output in `src/cli/output/format.ts` using the normal string escaping and the connectors `├──`, `└──`, and `│`. Render `ModelType: Name (id)` with `-> To` or `-> From` on edge lines and separate consecutive roots with one blank line.
- [ ] T015 [US1] Register `trace-element` and its single nonempty positional ID, and add standalone `help`, `help trace-element`, and `version` in `src/cli/arguments/options.ts`, `src/cli/arguments/help.ts`, and `src/cli/main.ts`. Run trace in the existing source child after shared partition selection and validate the normalized payload in `src/cli/source/child.ts`, `src/cli/source/ipc.ts`, and `src/cli/result.ts`. Use default depth one, keep help and version independent of source loading, and reject `--property` through the unknown-option path.

## Phase 5: User Story 2 - Follow Relationships Across Hops (P2)

**Goal**. Expand each root independently up to the requested hop depth.

**Independent test**. Compare the unit graph at depths one through three with expected paths. Run the existing service fixture's depth-two shared-topic trace and check that both services are reached.

- [ ] T016 [P] [US2] Extend `tests/unit/cli-trace.test.ts` with a compact graph for depths one through three, self-loops, an ancestor reached through an unused edge, and a shared element reached through distinct paths.
- [ ] T017 [P] [US2] Add valid and invalid depth checks in `tests/unit/cli-options.test.ts`, including repeated or missing values and the positive safe integer bound.
- [ ] T018 [US2] Add `--depth` parsing in `src/cli/arguments/options.ts`, document it in `src/cli/arguments/help.ts`, and pass it through `src/cli/source/child.ts`. Keep one hop as the default.
- [ ] T019 [US2] Extend `src/cli/commands/trace-element/trace.ts` so “Each root is at hop zero,” “Skip an edge already used on the current path,” and “When an unused edge returns to a path ancestor, emit that related element as a leaf.” Keep sibling paths independent, stop at the requested depth, and track by object identity. Keep the same branch ordering at every depth.

## Phase 6: User Story 3 - Scope the Lookup and Read Results in Automation (P2)

**Goal**. Scope root lookup with the shared selectors and return the same ordered trees in JSON.

**Independent test**. Publish one object twice and another object with the same ID. Check two trees across the full selection, one after narrowing selection, and one result document in JSON.

- [ ] T020 [P] [US3] Add focused tests in `tests/unit/cli-options.test.ts`, `tests/unit/cli-main.test.ts`, and `tests/unit/cli-trace.test.ts` for standalone help and version, exact IDs including whitespace and hyphen-prefixed values, repeated publication, duplicate authored IDs, unknown IDs, path-first selection with an unrelated broken entry, explicit tsconfig, unsupported options, and JSON error handling without a partial trace.
- [ ] T021 [P] [US3] Extend `tests/integration/cli-trace.test.ts` with the depth-two JSON trace of `shared` over `tests/integration/fixtures/microservice-environment`. Verify one result document, both services, and the depth bound. Use the existing loader suite for detailed path and config regressions.
- [ ] T022 [US3] Verify and complete trace selector and envelope handling in `src/cli/main.ts`, `src/cli/source/select.ts`, `src/cli/source/child.ts`, and `src/cli/source/ipc.ts`. Apply existing shared path filters before loading, honor `--tsconfig` and partition ID and name selectors, and keep traversal scoped to already-loaded links. Emit success `data.roots` and failure `data: null` through the existing envelope version, preserving source log isolation. Confirm parity of pretty and JSON ordering.

## Phase 7: Polish and Cross-Cutting Validation

- [ ] T023 Update `README.md` with the required-name API migration, standalone commands, trace examples using `-> To` and `-> From`, multiple roots, and listing and endpoint identity fields.
- [ ] T024 Run `npm run typecheck`, `npm test`, `npm run build`, and `npm run test:coverage` from `package.json`. Verify `specs/006-element-traceability/quickstart.md` and report combined coverage against the 85% target, keeping integration coverage limited to the main service fixture flows and using focused unit cases for gaps.

## Dependencies and Execution Order

1. T001 precedes T002 and T003. Both precede T004. T005 and T006 can proceed together after T004.
2. US4 follows the foundation. T007 and T008 can start together. T009 follows T008. T010 follows the test task T007 and can be validated after fixture migration T009.
3. US1 follows the canonical name and fixture work in US4. T011 and T012 can start together. T013 establishes the trace result used by T014 and T015. Complete both before testing the built CLI flow.
4. US2 follows US1. T016 and T017 can start together. Complete T018 before wiring depth into traversal in T019.
5. US3 follows US1 and US2. T020 and T021 can start together, then complete T022.
6. T023 can proceed after the CLI contracts are implemented. Run T024 after all required code and documentation changes.

## Parallel Examples

| Story | Tasks that can run together |
| --- | --- |
| US4 | T007 listing contract tests and T008 service fixture node updates |
| US1 | T011 focused trace and renderer tests and T012 service fixture pretty integration |
| US2 | T016 traversal test cases and T017 depth argument test cases |
| US3 | T020 focused lookup and error tests and T021 service fixture JSON integration |

## Implementation Strategy

Deliver the required-name foundation, US4, and the US1 default-depth trace as the MVP. Validate those independently, add configurable depth through US2, then finish selector and JSON behavior through US3. Keep the integration additions to the three main service flows. Use focused unit cases for invalid inputs and graph edge cases.
