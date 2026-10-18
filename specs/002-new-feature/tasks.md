# Tasks: Reusable Diagram Export

**Input**: Design documents from `/specs/002-new-feature/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Focused Vitest checks for deterministic export text, file output, and the documented host-language CLI workflow.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include an exact file path in each task description

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the repository baseline and target the existing TypeScript + Vitest implementation points for the feature.

- [ ] T001 Confirm the library entry points and validation scripts in package.json, tsconfig.json, and vitest.config.ts
- [ ] T002 [P] Review the current export contract and element surface in src/export/export-diagram.ts, src/index.ts, src/element/node.ts, and src/element/edge.ts
- [ ] T003 [P] Map the required feature behavior to the target tests in tests/unit/export-diagram.test.ts and tests/integration/quickstart.test.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the shared contract that all stories rely on before any story-specific work begins.

**Checkpoint**: The contract for notation, ordering, boundaries, and file-saving semantics is ready and testable.

- [ ] T004 Define the export contract for author-provided start/end text and deterministic node-before-edge ordering in src/export/export-diagram.ts
- [ ] T005 [P] Align the node and edge element APIs with the `toNotation()` contract and endpoint semantics in src/element/node.ts and src/element/edge.ts
- [ ] T006 [P] Add the baseline failing test coverage for empty selections, boundary text, and repeated deterministic output in tests/unit/export-diagram.test.ts
- [ ] T007 Confirm data-model and contract constraints for unique IDs, endpoint references, and exact diagram boundaries are represented in src/export/export-diagram.ts and specs/002-new-feature/contracts/diagram-export-contract.md

---

## Phase 3: User Story 1 - Export with Custom Notation (Priority: P1) 🎯 MVP

**Goal**: Deliver notation-agnostic export with author-owned boundary text and deterministic ordering for selected nodes and edges.

**Independent Test**: Export a selection using custom node and edge notation and custom boundary strings; verify the exact output, order, and empty-selection behavior without fixed `node:` or `edge:` labels.

### Tests for User Story 1

- [ ] T008 [P] [US1] Add a failing unit test for custom notation and exact boundary framing in tests/unit/export-diagram.test.ts
- [ ] T009 [P] [US1] Add a failing unit test for empty selection behavior and deterministic repeated output in tests/unit/export-diagram.test.ts

### Implementation for User Story 1

- [ ] T010 [US1] Update `exportDiagram()` in src/export/export-diagram.ts to emit all selected node fragments before edge fragments while preserving original order within each group
- [ ] T011 [US1] Update `exportDiagram()` in src/export/export-diagram.ts to accept author-supplied `startText` and `endText` and preserve them exactly, including the empty-selection case
- [ ] T012 [US1] Ensure each node and edge uses its own `toNotation()` method without framework-added `node:` or `edge:` labels in src/element/node.ts, src/element/edge.ts, and src/export/export-diagram.ts
- [ ] T013 [US1] Validate endpoint semantics and unique-ID usage for edge notation in src/element/edge.ts and the exported selection flow in src/export/export-diagram.ts

**Checkpoint**: User Story 1 should produce deterministic, author-owned export text that can be validated independently.

---

## Phase 4: User Story 2 - Save an Export to a File (Priority: P2)

**Goal**: Allow the already-generated diagram text to be written to an author-selected destination and expose failures clearly.

**Independent Test**: Save a known diagram to a chosen destination and verify file contents; then verify a failed write rejects instead of reporting success.

### Tests for User Story 2

- [ ] T014 [P] [US2] Add a failing file-save test for success and failure cases in tests/unit/export-diagram.test.ts
- [ ] T015 [P] [US2] Add an integration-level export-to-file assertion in tests/integration/quickstart.test.ts

### Implementation for User Story 2

- [ ] T016 [US2] Implement `saveDiagram(diagram, destination)` in src/export/export-diagram.ts using the host filesystem API and explicit error propagation
- [ ] T017 [US2] Update the public export surface in src/index.ts so authors can call the generated diagram and file-saving API directly
- [ ] T018 [US2] Document the file-output contract and the failure semantics in specs/002-new-feature/quickstart.md and README.md

**Checkpoint**: User Story 2 should be able to produce a saved file artifact and surface filesystem errors to the caller.

---

## Phase 5: User Story 3 - Export a Diagram from the CLI (Priority: P3)

**Goal**: Document and validate the host-language CLI workflow where an author writes an export function, invokes it with Node, and checks the generated file.

**Independent Test**: Run the documented author-written CLI workflow and verify it produces the expected file or emits the same failure as the underlying model-loading or write error.

### Tests for User Story 3

- [ ] T019 [P] [US3] Add a CLI validation scenario to tests/integration/quickstart.test.ts that exercises the author-written export function and generated file output
- [ ] T020 [US3] Capture the failure path where model loading or destination writing fails and assert the CLI invocation does not report success

### Implementation for User Story 3

- [ ] T021 [US3] Document the author-owned CLI workflow in specs/002-new-feature/quickstart.md without introducing a framework-provided export command
- [ ] T022 [US3] Verify the workflow calls `exportDiagram()` and passes the resulting text to `saveDiagram()` as described in specs/002-new-feature/contracts/diagram-export-contract.md
- [ ] T023 [US3] Ensure the example code and documentation surface model-loading and write failures without hiding them in a successful export result

**Checkpoint**: User Story 3 should be independently functional through the documented runtime workflow.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, documentation integrity, and cross-story cleanup.

- [ ] T024 [P] Run the focused validation suite for the export feature in tests/unit/export-diagram.test.ts and tests/integration/quickstart.test.ts
- [ ] T025 [P] Update the feature documentation and examples in README.md and specs/002-new-feature/quickstart.md to match the finalized export contract
- [ ] T026 Perform a final requirement check against FR-001 through FR-010 in specs/002-new-feature/spec.md and ensure all task descriptions have exact file paths and checklist formatting

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies; starts immediately
- **Foundational (Phase 2)**: depends on Setup and blocks all user stories
- **User Story 1 (Phase 3)**: depends on Foundational completion and is the MVP
- **User Story 2 (Phase 4)**: depends on Foundational completion and can proceed after US1 is stable
- **User Story 3 (Phase 5)**: depends on Foundational completion and may run after US1/US2 or in parallel with them if staffing allows
- **Polish (Phase 6)**: depends on all desired stories being complete

### User Story Dependencies

- **US1**: no dependency on other stories; must complete before the export feature is considered MVP-ready
- **US2**: independent of US1 at the contract level, but shares the same export engine and file-output semantics
- **US3**: independent of US1/US2 in design, but uses the same API contract and validation workflow

### Parallel Opportunities

- Setup tasks T001-T003 can run in parallel
- Foundational tasks T004-T007 can run in parallel once the contract is understood
- User story tests for US1, US2, and US3 can be written in parallel once the contract has been defined
- Different model and docs tasks under a story can run in parallel when their file sets do not overlap

---

## Parallel Example: User Story 1

```bash
# Run the unit tests for the export contract together once the red/green test tasks are in place
vitest run tests/unit/export-diagram.test.ts

# Work on the model and exporter files in parallel when the contract is stable
# - src/element/node.ts
# - src/element/edge.ts
# - src/export/export-diagram.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundational tasks
2. Implement the custom notation and boundary-text export flow in src/export/export-diagram.ts
3. Validate empty-selection, ordering, and deterministic output with the unit tests
4. Stop and confirm that User Story 1 satisfies its independent test before moving on

### Incremental Delivery

1. Complete US1 export behavior and verify its deterministic output
2. Add file-save support for the already-generated diagram text (US2)
3. Document and validate the author-written CLI workflow (US3)
4. Finish polish and cross-cutting quality checks before release

---

## Summary

- Total tasks: 26
- User Story 1 task count: 6
- User Story 2 task count: 5
- User Story 3 task count: 5
- Parallel opportunities: Setup, foundational tasks, story test creation, and final documentation validation are all parallelizable when the contract is stable
- Suggested MVP scope: User Story 1 only, with the core export contract and deterministic output proving the feature's value
- Format validation: all checklist items start with `- [ ]`, include a sequential `T###` ID, use `[P]` only when the task is parallelizable, include `[US1]`, `[US2]`, or `[US3]` only in story phases, and reference exact file paths in every task description
