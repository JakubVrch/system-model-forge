# Tasks: Extensible Graph Core

**Input**: Design documents in `/specs/001-governed-model-core/` (plan.md, spec.md, data-model.md, research.md, contracts/, quickstart.md)
**Working branch**: `001-governed-model-core` (created)
**Prerequisites**: Node.js 24 LTS, Yarn
**Tests**: Included (requested). Cadence rule: **every task that adds source code is followed by a test run** (`yarn typecheck && yarn test`). Each phase ends with a **CHECKPOINT** that must be green before continuing. If a checkpoint fails, fix it before starting new work.

## Format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

- **[P]**: parallelizable (different files, no dependency on incomplete tasks)
- **[Story]**: US1 = Define and Create Elements, US2 = Traverse, US3 = Select and Export

**Mermaid note**: [Mermaid architecture syntax](https://mermaid.ai/open-source/syntax/architecture.html) is used **only as sample notation inside tests** (e.g. a test `ServiceNode.toNotation()` returning `service api(server)[API]`, a test `ServiceEdge.toNotation()` returning `api:R --> L:db`). Do **not** add a Mermaid dependency, parser, renderer, or any Mermaid-specific code under `src/`; the exporter contract is unchanged and treats notation as opaque text.

---

## Phase 1: Setup (runnable skeleton first)

**Purpose**: Get a compiling, test-running project before any feature code.

- [ ] T001 Create `package.json` at repo root: `"type": "module"`, `engines.node` ">=24", scripts `build` (`tsc -p tsconfig.build.json`), `typecheck` (`tsc --noEmit`), `test` (`vitest run`), devDependencies `typescript` and `vitest`; run `yarn install` to create the lockfile
- [ ] T002 [P] Create strict `tsconfig.json` at repo root (`strict`, `module`/`moduleResolution` `NodeNext`, `target` ES2023, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, include `src` and `tests`) and `tsconfig.build.json` (extends it, `outDir` `dist`, `declaration`, include `src` only)
- [ ] T003 [P] Create `vitest.config.ts` at repo root (include `tests/**/*.test.ts`, `typecheck.enabled: true` with `typecheck.include` `tests/type/**/*.test-d.ts`)
- [ ] T004 Create empty `src/index.ts` and a smoke test `tests/unit/smoke.test.ts` (`expect(1).toBe(1)`); add `.gitignore` entries for `node_modules` and `dist` if missing
- [ ] T005 Run `yarn typecheck && yarn test` from the repository root using `package.json`, `tsconfig.json`, and `vitest.config.ts`; both must pass

**CHECKPOINT 1**: Toolchain works end-to-end on an empty library.

---

## Phase 2: Foundational (base class + adjacency, tested in isolation)

**Purpose**: Blocking pieces used by all stories.

- [ ] T006 [P] Create abstract `ModelElement` in `src/element/model-element.ts` per contracts/typescript-declaration-contract.md: `protected constructor()`, `abstract toNotation(): string`, no `id` field
- [ ] T007 [P] Create `src/element/adjacency.ts`: an internal (not exported from `src/index.ts`) helper holding private per-node storage of `outgoing` and `incoming` edge arrays in creation order, with `registerOutgoing(edge)`, `registerIncoming(edge)`, and read functions returning frozen snapshot arrays of references (`edges` = union in creation order, a self-loop appearing once). Use a module-level `WeakMap<object, …>` keyed by node so no public mutable storage exists
- [ ] T008 [P] Write `tests/unit/adjacency.test.ts` using plain objects as keys: registration order, self-loop appears once in union and in both direction arrays, returned arrays are frozen (`Object.isFrozen`), mutation attempt throws in strict mode, an unknown key returns three empty arrays, reads do not change later results
- [ ] T009 Run `yarn typecheck && yarn test` for `src/element/adjacency.ts` and `tests/unit/adjacency.test.ts`; fix until green

**CHECKPOINT 2**: Adjacency logic verified before classes depend on it.

---

## Phase 3: User Story 1 - Define and Create Graph Elements (P1) 🎯 MVP

**Goal**: Authors subclass `Node`/`Edge`, create instances (including with `undefined` endpoints), with overridable notation.
**Independent Test**: Define specialized classes, create instances, verify behavior and exact endpoint references are retained.

- [ ] T010 [P] [US1] Write `tests/unit/node-edge-creation.test.ts` (will fail until T012-T013): core `new Node().toNotation() === "Node"`; `new Edge(a, b).toNotation() === "Edge"`; `edge.from === a` and `edge.to === b` (same references); `new Edge(undefined, undefined)`, `new Edge(a, undefined)`, `new Edge(undefined, b)` do not throw and keep `undefined`; subclass `ServiceNode extends Node` with an extra method and a Mermaid-architecture-style notation override (test-only) and `ServiceEdge extends Edge` with a similar override both retain behavior and are `instanceof` base classes
- [ ] T011 [P] [US1] Write `tests/type/declarations.test-d.ts` using Vitest `expectTypeOf`: `Edge["from"]` is `Node | undefined`; assigning to `edge.from` is a type error (`@ts-expect-error`); `ModelElement` cannot be instantiated directly (`@ts-expect-error`); `Node`/`Edge` constructor signatures match contract; no `id` property on elements
- [ ] T012 [US1] Implement `Node` in `src/element/node.ts` extending `ModelElement`: public no-arg constructor, `toNotation()` returning `"Node"`; leave `edges`/`outgoing`/`incoming` getters returning empty frozen arrays for now (wired in US2)
- [ ] T013 [US1] Implement `Edge` in `src/element/edge.ts`: `readonly from: Node | undefined`, `readonly to: Node | undefined`, constructor `(from, to)` that never throws, `toNotation()` returning `"Edge"`
- [ ] T014 [US1] Export `ModelElement`, `Node`, `Edge`, and `type GraphElement = Node | Edge` from `src/index.ts`
- [ ] T015 [US1] Run `yarn typecheck && yarn test` for `src/element/` and `tests/unit/node-edge-creation.test.ts` plus `tests/type/declarations.test-d.ts`; US1 tests (T010-T011) must pass

**CHECKPOINT 3 (MVP)**: Elements can be defined, created, and type-checked; the library builds (`yarn build`).

---

## Phase 4: User Story 2 - Traverse Connected Elements (P1)

**Goal**: Direct traversal via `Node.edges/outgoing/incoming` and `Edge.from/to`.
**Independent Test**: Reference graph with isolated node, cycle, parallel edges; verify all traversal results.

- [ ] T016 [P] [US2] Write `tests/unit/traversal.test.ts` (fails until T017-T018): `edges` contains exactly incident edges in creation order; `outgoing` only `from === node`; `incoming` only `to === node`; isolated node has three empty arrays; self-loop once in `edges`, in both `outgoing` and `incoming`; parallel edges are distinct entries; 3-node cycle traversal returns correct edges; edges with an `undefined` endpoint appear only on the defined endpoint; arrays contain the same object references (`toBe`) and are frozen; creating a later edge appears in subsequent reads but a previously held array is unchanged; repeated reads give equal results; `edges.filter(e => e instanceof ServiceEdge)` works natively
- [ ] T017 [US2] Wire `Node` getters in `src/element/node.ts` to read from `src/element/adjacency.ts`
- [ ] T018 [US2] In `src/element/edge.ts` constructor, register the edge as outgoing on a defined `from` and incoming on a defined `to` via adjacency helpers (internal only; no public registration API)
- [ ] T019 [P] [US2] Add traversal type assertions to `tests/type/declarations.test-d.ts`: `Node["edges"]`, `outgoing`, `incoming` are `readonly Edge[]`; pushing to them is a type error
- [ ] T020 [US2] Run `yarn typecheck && yarn test` for `src/element/` and `tests/unit/` plus `tests/type/declarations.test-d.ts`; all US1 and US2 tests must pass

**CHECKPOINT 4**: Traversal works and earlier stories still pass.

---

## Phase 5: User Story 3 - Select and Export a Diagram (P2)

**Goal**: Deterministic `exportDiagram()` over a caller-supplied array.
**Independent Test**: Filter a mixed array with native `filter()`, export, verify exact output.

- [ ] T021 [P] [US3] Write `tests/unit/export-diagram.test.ts` (fails until T022-T023) with exact-string assertions: empty input is exactly `"diagram\nend\n"`; node line `  node: <notation>` and edge line `  edge: <from> -> <to>: <edge notation>` between `diagram` and `end`, ending with a trailing newline; endpoint rendered by its notation or the bare token `undefined`; edge whose endpoint node is not in the selection does not add a node line; parallel edges and duplicate supplied entries each produce their own line; cycle and self-loop exported without merging; custom notation from subclasses is used, with Mermaid-architecture-style strings defined in the test file only (exporter treats them as opaque text); lines sorted by code-unit order (use plain `<` comparison, not `localeCompare`) regardless of input order; input array is not mutated
- [ ] T022 [US3] Implement `exportDiagram(elements: readonly GraphElement[]): string` in `src/export/export-diagram.ts` per the Diagram Contract in contracts/typescript-declaration-contract.md (build full element lines, sort by code-unit order, join with `\n`, frame with `diagram`/`end`, trailing newline; no locale-dependent APIs)
- [ ] T023 [US3] Export `exportDiagram` from `src/index.ts`
- [ ] T024 [P] [US3] Write `tests/integration/quickstart.test.ts` mirroring quickstart.md end to end via the package entry `src/index.ts`: build specialized graph (test-only Mermaid-style notation), traverse, select with `Array.prototype.filter`, export; additionally assert 100 repeated exports are byte-identical and that exporting does not change any node's `edges`/`outgoing`/`incoming`
- [ ] T025 [P] [US3] Add `tests/type/declarations.test-d.ts` assertion that `exportDiagram` accepts `readonly GraphElement[]` and returns `string`, and that no filter/query API is exported (assert the module's export keys equal `ModelElement`, `Node`, `Edge`, `exportDiagram` at runtime in `tests/unit/public-surface.test.ts`)
- [ ] T026 [US3] Run `yarn typecheck && yarn test` for `src/`, `tests/`, and `vitest.config.ts`; the entire suite must pass

**CHECKPOINT 5**: All three user stories work together.

---

## Phase 6: Polish & Cross-Cutting

- [ ] T027 Run `yarn build` and confirm `dist/` emits `.js` and `.d.ts` files whose declarations match the TypeScript declaration contract
- [ ] T028 [P] Add package `exports`/`types` fields in `package.json` pointing at `dist/index.js` and `dist/index.d.ts`, plus a `README.md` snippet at repo root summarizing usage taken from quickstart.md
- [ ] T029 Walk through every step of `specs/001-governed-model-core/quickstart.md` and verify each expected outcome is covered by a passing test; add a missing test if any step is not covered
- [ ] T030 Final full run from the repository root: `yarn install --frozen-lockfile && yarn typecheck && yarn test && yarn build`, validating `package.json`, `yarn.lock`, `src/`, and `tests/`

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) → Phase 6.
- US2 depends on US1 (classes exist). US3 depends on US1; it is only meaningfully testable with US2's adjacency in place for the integration test (T024), but `exportDiagram` itself (T022) uses only notation and endpoints.
- Within a story: tests are written first, expected to fail, then implementation, then the run task turns them green.
- Never begin a new phase while the previous checkpoint is red.

## Parallel Opportunities

- Phase 1: T002 and T003 together.
- Phase 2: T006 and T007 can be implemented in parallel; T008 can be authored against the adjacency helper contract in parallel, then run after T007.
- US1: T010 and T011 (test files) in parallel before T012-T014.
- US2: T016 and T019 in parallel.
- US3: T021, T024, and T025 in parallel (distinct files).

## Implementation Strategy

- **MVP**: Phases 1-3 (US1). Stop and validate at Checkpoint 3.
- **Incremental**: add US2, then US3; each ends with a full green test run, so no more than a few small files are ever written between runs.
- **Scope guard**: no partitions, validation, query/filter API, CLI, or ids (see plan.md Out of Scope).
