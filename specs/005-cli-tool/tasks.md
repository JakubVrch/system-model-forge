---
description: "Dependency-ordered implementation tasks for the CLI Tool"
---

# Tasks: CLI Tool

**Input**: Design documents in `specs/005-cli-tool/`: spec.md, plan.md, research.md, data-model.md, contracts/, and quickstart.md.
**Prerequisites**: Approved design artifacts above and `.specify/memory/constitution.md` v1.1.0.
**Tests**: Include failing contract and behavior tests requested by the design contracts and specification acceptance scenarios. Preserve existing graph, immutability, and declaration coverage. Write the applicable tests before implementation and confirm they fail for the intended behavior.
**Organization**: Shared setup and foundation, then US1–US3 (P1) in specification order, US4 (P2), and cross-cutting validation. This file schedules implementation; it does not claim implementation or checks have passed.

## Format and paths

Tasks use `- [ ] Tnnn [P?] [USn?] Description with file path`. `[P]` means independent files within the stated execution wave after prerequisites complete; it does not bypass phase dependencies. Paths are repository-relative. Existing library files move to `src/core/`; the CLI lives in sibling `src/cli/`. New focused tests use `tests/unit/cli-*.test.ts` and `tests/integration/fixtures/cli/`. Keep one package and the existing `yarn.lock`; do not introduce a second lockfile, publish, or choose a release number.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Relocate the library and establish compiled CLI test infrastructure without changing public import names.

- [ ] T001 Move `src/index.ts` and all modules under `src/collection/`, `src/element/`, `src/export/`, `src/partition/`, and `src/query/` into the corresponding `src/core/` paths; update aliases/import references in `tsconfig.json`, `vitest.config.ts`, `knip.json`, `tests/`, and `README.md`; retain internal relative layout and prohibit core imports of CLI modules.
- [ ] T002 Set compiler rootDir to `src` in `tsconfig.build.json` and point main/types/root exports in `package.json` to `dist/core/index.js` and `dist/core/index.d.ts`; update `tests/type/declarations.test-d.ts` and `tests/unit/public-surface.test.ts`, then run existing typecheck, tests, and build to establish that the relocation preserves the public library.
- [ ] T003 Add compatible `tsx` as a production dependency in `package.json` and update `yarn.lock` with the existing package manager; retain Node >=24, strict NodeNext, current package name/version, and private status.
- [ ] T004 Add subprocess/temporary-directory helpers in `tests/integration/cli-helpers.ts` and arrange compiled-test setup in `vitest.config.ts` so `npm test` builds fresh `dist/cli/` code before CLI tests without test/build recursion; helpers capture stdout, stderr, exit status, and clean up temporary artifacts.

**Checkpoint**: Relocated core passes existing checks; subsequent tests can exercise the compiled executable.

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared authoring contracts, request/result types, discovery, selection, and a single isolated source-loading lifetime. All user stories depend on this phase.

- [ ] T005 [P] Add failing identity/business-method/protocol tests in `tests/unit/element-info.test.ts` and type coverage in `tests/type/element-info.test-d.ts` for required IDs, unchanged factory inference/freezing, fresh default snapshots, inherited own data, skipped getters/symbols/private/non-enumerable/framework fields, unsupported values, overrides, duplicate-ID preservation, and immutable versioned graph kind.
- [ ] T006 [P] Add failing required-extension tests in `tests/unit/define-partition.test.ts` and `tests/type/partition.test-d.ts` for frozen copied fileExtension, required typing, exact text/source membership, and unchanged optional contribution groups/key inference.
- [ ] T007 Implement the abstract readonly string `id` and default `getElementInfo()` in `src/core/element/model-element.ts`, explicit `Node(id)` in `src/core/element/node.ts`, and `Edge(from, to, id)` in `src/core/element/edge.ts`; preserve endpoint positions, use own enumerable data descriptors only, exclude id/framework fields and edge endpoints, skip unsupported values, and return fresh readonly flat snapshots. Preserve the data-model constraints “Required readonly author-assigned string ID and getElementInfo() method.” and “No ID-uniqueness enforcement or constructor profile registration.”
- [ ] T008 Add/export the immutable non-enumerable prototype protocol using `Symbol.for('governed-model-core.graphKind.v1')` with `{version:1,kind:'node'|'edge'}` in `src/core/element/graph-element.ts`, `src/core/element/node.ts`, `src/core/element/edge.ts`, and `src/core/index.ts`; keep business `kind` separate and retain `defineElement` signature, inference, `.is`, and shallow freezing.
- [ ] T009 Add required readonly `fileExtension: string` to `PartitionDiagram` and copy it unchanged into frozen publication records in `src/core/partition/define-partition.ts`; preserve the data-model constraint “Publication preserves all values and membership; filenames are derived only at build time.”
- [ ] T010 Migrate author-assigned IDs, edge constructor forwarding, and explicit diagram extensions throughout `tests/unit/`, `tests/type/`, `tests/integration/microservice-environment.test.ts`, `tests/integration/fixtures/microservice-environment/`, and `README.md`; do not derive IDs automatically, retain EventFlow's automatic stored `kind`, and rerun core typecheck/tests/build before CLI behavior changes.
- [ ] T011 Define internal invocation, inventory, loaded-candidate, selected-export, element/endpoint/group, build-plan/summary, IPC, and schemaVersion 1 envelope types in `src/cli/result.ts` from `specs/005-cli-tool/contracts/output-contract.md`; encode exact metadata fields, optional parent identity, null absent endpoints/modelType, command/null/help/version discriminants, contextual errors, and partial-build-only failure data. Preserve “Exactly one parent-produced document; error null on success” and keep absolute paths/live objects/internal state out of normal public results.
- [ ] T012 [P] Add failing strict option tests in `tests/unit/cli-options.test.ts` for defaults, repeated selectors versus singleton rejection, both option syntaxes, command-specific flags, cwd-relative paths, positive integer limits, empty selectors, unexpected positionals, and recognized JSON requests on otherwise invalid arguments.
- [ ] T013 [P] Add failing discovery tests in `tests/unit/cli-discover.test.ts` for pruning, symlinks, explicitly supplied support-named root, canonical build destination, ordinal POSIX paths, candidate-folder ambiguity, unloaded ancestor paths, and valid/invalid bounded globs.
- [ ] T014 [P] Add failing selection tests in `tests/unit/cli-select.test.ts` for union within kinds/intersection across kinds, each explicit value matching candidates, empty intersections, duplicate names versus duplicate loaded IDs, no parent-to-child expansion, overlapping match deduplication, and implicit empty discovery success.
- [ ] T015 Implement native `util.parseArgs` options and validation in `src/cli/options.ts`, including `--root`, `--format`, `--tsconfig`, ID/name/path selectors and all command flags; preserve “Strict options; positive limit; build out required”, resolve supplied paths from cwd, and detect recognized JSON requests before returning argument errors.
- [ ] T016 Implement directory inventory, nearest-ancestor paths, pruning and path-first filtering in `src/cli/discover.ts` using native filesystem APIs and `path.posix.matchesGlob`; support only segment `*`/`?` and whole-segment `**`, reject absolute/traversal/backslash/bracket/brace/extglob patterns, and preserve “Pruned directories, no symlink traversal, candidate-folder ambiguity”. Check folder ambiguity among candidates after path filtering, without loading excluded entries.
- [ ] T017 Implement partition ID/name selection and public partition validation in `src/cli/select.ts`; preserve “Required public contract; unique candidate IDs”, validate explicit matches against path candidates before intersecting, allow duplicate names and distinct element IDs, and enrich parent identity only from already loaded candidates.
- [ ] T018 Add failing source-process tests in `tests/integration/cli-loader.test.ts` and focused source fixtures under `tests/integration/fixtures/cli/loading/` for nearest/explicit tsconfig aliases, shared imported graph identity, source-versus-compiled graph kinds, path-excluded broken entries, actual broken imports, missing/malformed named partition exports, direct stdout writes, early child exit, and lingering authored handles.
- [ ] T019 Implement child loading and validated IPC in `src/cli/child.ts` and lifecycle/dispatch scaffold in `src/cli/main.ts`: resolve installed tsx preload once per invocation, load all candidates in one child, discover nearest tsconfig upward or use override via TSX_TSCONFIG_PATH, disable tsx disk cache, drain source stdout/stderr to parent stderr, reject invalid/missing child results, terminate after the result, and propagate interruption/cleanup. Keep graph objects in the child and install only handlers as each story lands.

**Checkpoint**: Shared contracts and selection/loading tests pass. No build write occurs until a complete validated child plan and parent preflight succeed. Help/version paths can bypass the loader.

## Phase 3: User Story 1 — Build Published Diagrams (Priority: P1) — MVP

**Goal**: Export exact published diagram text into source-relative folders with deterministic unconditional overwrite and truthful summaries.
**Independent Test**: Build at least three nested partitions with two diagrams per contributing partition into a temporary destination; verify exact bytes/paths, selectors, mixed extensions, collision winner, no-diagram summaries, dry-run zero writes, and a deterministic partial-write failure.

### Tests for User Story 1

- [ ] T020 [P] [US1] Add failing build-plan/preflight/write tests in `tests/unit/cli-build.test.ts` for mixed/multipart extensions, empty text, invalid keys/extensions/final names, source-root equality/source overwrite, lexical escape/symlink components, unconditional writes, ordinal collision order, distinct file counts, dry-run, and first-failure partial summaries.
- [ ] T021 [P] [US1] Add compiled build acceptance tests in `tests/integration/cli-build.test.ts` with fixtures in `tests/integration/fixtures/cli/build/`: at least three nested partitions and two diagrams per contributor, selected/unselected partitions, zero diagrams, existing outputs, collisions, invalid later diagram preventing all writes, and a deterministic obstruction after an earlier successful write; assert pretty/JSON agreement and exits.

### Implementation for User Story 1

- [ ] T022 [US1] Normalize all selected diagrams into an ordered build plan in `src/cli/child.ts`, preserving “Valid extension/name, containment, no source overwrite” for build plan items and passing exact published text to the parent; validate dot-prefixed nonempty/multipart extensions, reject lone dot, separators/control/NUL/traversal and invalid filenames, and never regenerate notation or clean diagram data.
- [ ] T023 [US1] Implement full destination preflight and dry-run in `src/cli/build.ts`: derive entry-directory/key/extension paths, reject root equality and source overwrites, inspect existing symlink components and filesystem containment for every destination before creating anything, accept ordinary collisions/overwrites, and return planned artifacts/distinct plannedFiles with exportedFiles zero and no tool-managed disk writes.
- [ ] T024 [US1] Implement sequential unconditional writes in `src/cli/build.ts`, sorted by normalized source path then diagram key; preserve “Unique successful destinations counted; no false success”, include entered zero-diagram partitions, mark diagram keys only after success, count distinct successful destinations including host filesystem collisions, stop at the first write failure, and retain the truthful partial summary without rollback or stale-file deletion.
- [ ] T025 [US1] Wire build execution and schemaVersion 1 success/failure rendering in `src/cli/main.ts` and build pretty summary in `src/cli/format.ts`; report one processed-partition/diagram-key summary and exportedFiles, dry-run planned paths/counts, contextual error and exit 1 for failures, and no per-artifact status stream.

**Checkpoint**: US1 is executable independently; repeat builds overwrite selected files and dry-run produces no CLI-managed files/directories/caches.

## Phase 4: User Story 2 — Inspect Exported Elements (Priority: P1)

**Goal**: Inspect separate export memberships with complete business attributes, identity, descriptive endpoints, and bounded output.
**Independent Test**: Inspect five nodes and three edges with heterogeneous attributes using both formats and limit two; expect node counts 5/2/3 and edge counts 3/2/1, correct full-export endpoint membership, projection retaining metadata, duplicate IDs remaining distinct, and exact export provenance.

### Tests for User Story 2

- [ ] T026 [P] [US2] Add failing normalization tests in `tests/unit/cli-inspect.test.ts` for export-key groups, missing/empty exports, once-per-object method caching, flat value validation, invalid/thrown overrides, skipped/accessor fields, duplicate IDs, source graph-kind versions, descriptive modelType, projection before limits, ordered refs, external/absent endpoints, and identity metadata unaffected by projection.
- [ ] T027 [P] [US2] Add failing element-table tests in `tests/unit/cli-element-format.test.ts` for union-of-attributes columns, separate groups, counts/empty labels, custom metadata-overlapping names, missing/null/undefined/zero/empty-string values, Unicode and multiline/control escaping, and no silent truncation.
- [ ] T028 [P] [US2] Add compiled list-elements acceptance tests in `tests/integration/cli-elements.test.ts` and fixtures under `tests/integration/fixtures/cli/inspection/` for five nodes/three edges, shared objects across exports, equal IDs on distinct objects, edge-only selections, model types/external identity, projection and limits, malformed business values/missing IDs, and table/JSON parity without graph mutation/navigation.

### Implementation for User Story 2

- [ ] T029 [US2] Add exact element/diagram export-key union selection in `src/cli/select.ts`, keeping same-named groups separate, full source iteration order and provenance; preserve “Requested keys must match; empty exports valid”, allow a requested key absent from some partitions but require each requested key somewhere in selected partitions, and list available keys on failure.
- [ ] T030 [US2] Implement descriptor-safe graph recognition, modelType extraction, identity and cached business-method normalization in `src/cli/inspect.ts`; preserve “Business-method record, required ID, author-owned uniqueness” and “Element information contains strings, finite numbers, null, and undefined only”. Accept plain synchronous data records, reject accessors/nonfinite/richer override values and thrown methods with element/attribute context, use class constructor data-property names or null for base/unavailable type, and never traverse adjacency or merge by ID.
- [ ] T031 [US2] Implement response-local object refs, endpoint summaries, projection and independent per-group limits in `src/cli/inspect.ts`; preserve “Absent endpoint null; membership from full selected export” and “returned + omitted = total; limit applies independently”. Allocate e1/e2 refs on first deterministic encounter, retain name/label/id/modelType independently of attributes, validate requested properties against full selected membership before limiting, and do not add external endpoints to selections.
- [ ] T032 [US2] Implement element pretty tables and JSON attribute normalization in `src/cli/format.ts`; preserve “JSON normalizes explicit undefined to null while absent keys stay omitted.” Use ordinal attribute columns with `(missing)` cells, separate mandatory metadata, readable full values and visible control escapes, explicit empty/limited groups and total/returned/omitted counts; render negative zero as zero.
- [ ] T033 [US2] Integrate list-elements normalization in `src/cli/child.ts` and dispatch/rendering in `src/cli/main.ts`, ordering paths then elements-before-diagrams then keys while preserving membership order, returning no partial inspection data on failure, and checking existing fixture composition/immutability remains unchanged.

**Checkpoint**: US2 works without a prior build and neither mutates nor expands published selections.

## Phase 5: User Story 3 — Discover Partition Contributions (Priority: P1)

**Goal**: Inventory every public export and its counts without exposing element payloads, executable definitions, or diagram text.
**Independent Test**: Inventory the six-partition microservice fixture in pretty and JSON formats; check identity-only/vocabulary-only/full partitions, all export keys/counts/extensions, parent paths and optional identity, and shared selectors.

### Tests for User Story 3

- [ ] T034 [P] [US3] Add failing inventory/format tests in `tests/unit/cli-partition-info.test.ts` for all three groups, ordinal key order, exact node/edge counts, diagram extensions, empty maps, no business-method evaluation/payloads/notation, and parent identity omitted when the ancestor was not loaded.
- [ ] T035 [P] [US3] Add compiled partition-info acceptance tests in `tests/integration/cli-partition-info.test.ts` using `tests/integration/fixtures/microservice-environment/` and `tests/integration/fixtures/cli/loading/`; assert six fixture partitions, matching pretty/JSON data, ID/name/path selection parity, empty discovery, and path-only ancestry despite an excluded invalid ancestor.

### Implementation for User Story 3

- [ ] T036 [US3] Add partition inventory normalization in `src/cli/inspect.ts`, counting full source node/edge membership via graph kind, listing metamodel keys without serializing definitions, emitting explicit empty arrays and diagram extensions, and deriving parent metadata from discovery plus already loaded candidates without invoking business methods or loading ancestors.
- [ ] T037 [US3] Add compact partition-info pretty rendering in `src/cli/format.ts` and wire the child handler/parent dispatcher in `src/cli/child.ts` and `src/cli/main.ts`; return all identity/path/parent/export/count fields from the output contract with no element records or diagram text in either format.

**Checkpoint**: US3 works without prior inspection or build, and its counts are independent of list-elements output limits.

## Phase 6: User Story 4 — Use the CLI Reliably in Automation (Priority: P2)

**Goal**: Make all commands discoverable, installable, deterministic, noninteractive, and reliable under redirected output and failures.
**Independent Test**: Follow built-in help to inventory, inspect and build with the installed binary; parse exactly one JSON document per success/failure/help/version, repeat deterministic scenarios three times, and check exit statuses, source-output isolation, and actionable errors.

### Tests for User Story 4

- [ ] T038 [P] [US4] Add compiled automation contract tests in `tests/integration/cli.test.ts` for top-level/command help and version without source loading, JSON help/version, invalid dispatch/flags/formats/selectors, direct source writes forwarded only to stderr, no ANSI/prompts/default stacks, malformed/early child exit, cleanup, all-command exact-ID selection amid duplicate names, and three identical repeated JSON/artifact runs.
- [ ] T039 [P] [US4] Add production installed-package smoke coverage in `tests/integration/cli-package.test.ts`: pack built package, install tarball with production dependencies in a fresh temporary consumer, author a model importing the public package root, run installed model-forge for help/version and all three commands, assert core declarations/runtime exports and child/tsx availability without repository source/dev dependencies, and clean up without publish/global install.

### Implementation for User Story 4

- [ ] T040 [US4] Complete top-level and command help/version in `src/cli/options.ts` and `src/cli/main.ts`, reporting package version without evaluating sources; document required/default flags, pretty/json, exits, quoted bounded globs, literal ID/name selectors, unions/intersections, subtree patterns, path-first isolation versus ID/name loading, overwrite/dry-run semantics, trusted execution and an inventory-to-inspect-to-build example.
- [ ] T041 [US4] Audit and finish centralized error/envelope handling and process cleanup in `src/cli/main.ts`, `src/cli/child.ts`, and `src/cli/format.ts`: exactly one JSON document plus newline, recognized JSON despite other invalid arguments, null data except partial builds, context and corrective guidance, plain stderr diagnostics, source-output isolation, supported-format error behavior, and exit 0/1 without hangs or interactive prompts.
- [ ] T042 [US4] Add executable shebang in `src/cli/main.ts` and `model-forge` bin targeting `dist/cli/main.js` in `package.json`; ensure packing includes compiled child/core/declarations and runtime tsx dependency, preserves package-root import names, and passes the production-only installed-consumer test.

**Checkpoint**: Every command works from an installed tarball and has stable machine-readable results independent of source logging.

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Document migration and validate the integrated deliverable on supported hosts.

- [ ] T043 [P] Document the CLI workflow, every selector/format, schemaVersion 1 results, mandatory IDs and Edge third-argument migration, required fileExtension migration, default/override business fields and TypeScript-private caveat, source execution/dry-run limits, overwrite/collision/partial failure behavior in `README.md`; verify examples against `specs/005-cli-tool/quickstart.md` and describe breaking release impact without publishing or choosing a version.
- [ ] T044 [P] Add Linux/macOS/Windows Node >=24 CI coverage in `.github/workflows/ci.yml` (integrate with any workflow present at implementation time) using `yarn.lock`; run typecheck, tests, build and installed CLI coverage, including Unicode/space paths, separator normalization, symlink checks and actual host-filesystem collision behavior from `tests/integration/cli-build.test.ts`.
- [ ] T045 Run `npm run typecheck`, `npm test`, and `npm run build`, execute the compiled and installed CLI walkthroughs in `specs/005-cli-tool/quickstart.md`, and record commands/results in `specs/005-cli-tool/validation.md`; verify exact output bytes and three-run determinism, no dry-run tool writes, no unexpected graph/getter traversal, and complete acceptance/error/empty-case coverage. Record unsupported local platform checks as pending CI rather than claiming they passed.

## Dependencies & Execution Order

```text
Setup T001–T004
  -> Foundation T005–T019
       -> US1 T020–T025 (MVP)
       -> US2 T026–T033
       -> US3 T034–T037
  -> US4 T038–T042 (integration requires US1 + US2 + US3)
  -> Polish T043–T045
```

- Setup is sequential: relocate, validate packaging paths, add dependency, establish harness.
- Foundation waves: T005/T006 together; T007–T010 in order after their contract tests; T011 establishes shared types; T012/T013/T014 together; T015/T016/T017 implement their contracts; T018 precedes T019. Complete the entire foundation before story implementation.
- US1, US2 and US3 have no functional dependency on one another beyond foundation. The recommended execution is specification order because `src/cli/main.ts`, `src/cli/child.ts`, `src/cli/format.ts` and, for US2/US3, `src/cli/inspect.ts` are shared integration files. Serialize edits to these files; do not treat entire story branches as conflict-free.
- Within each story, complete its test wave first and observe expected failures. Then implement tasks in listed order. US4 tests may be authored after foundation, but completion requires all three command handlers and their results.
- T043 and T044 can proceed concurrently after US4; T045 depends on both. Fix failures before declaring implementation complete.

## Parallel Execution Examples

These are implementation scheduling examples, not instructions to spawn agents during task generation.

| Story | Independent parallel test wave | Following work |
| --- | --- | --- |
| US1 | T020 `tests/unit/cli-build.test.ts` + T021 `tests/integration/cli-build.test.ts`/build fixtures | T022 → T023 → T024 → T025 |
| US2 | T026 `tests/unit/cli-inspect.test.ts` + T027 `tests/unit/cli-element-format.test.ts` + T028 `tests/integration/cli-elements.test.ts`/inspection fixtures | T029 → T030 → T031 → T032 → T033 |
| US3 | T034 `tests/unit/cli-partition-info.test.ts` + T035 `tests/integration/cli-partition-info.test.ts` (existing fixtures read only) | T036 → T037 |
| US4 | T038 `tests/integration/cli.test.ts` + T039 `tests/integration/cli-package.test.ts` | T040 → T041 → T042 |

Additional independent waves: T005/T006 core contracts; T012/T013/T014 shared CLI tests; T043/T044 documentation and CI. Fixtures and helpers must be complete before dependent subprocess tests run. A `[P]` marker applies to writing the test or document in its wave, not permission to run a test successfully before the implementation it exercises exists.

## Requirements Coverage

| Requirements | Tasks |
| --- | --- |
| FR-001–005, FR-026: commands, discovery, selectors, ancestry | T011–T019, T034–T038, T040–T042 |
| FR-006–009, FR-022: exact builds, extensions, safe paths, overwrites, dry-run | T006, T009–T010, T020–T025 |
| FR-010–014, FR-023–025, FR-027: inspection, IDs, business data, limits, types | T005, T007–T008, T010–T011, T026–T033 |
| FR-015: complete partition inventories without payloads | T034–T037 |
| FR-016–019: output, errors, deterministic automation | T011–T019, T025, T032–T033, T037–T041, T045 |
| FR-020: graph/publication preservation and source loading | T001–T010, T018–T019, T026–T033, T045 |
| FR-021: documented discover → inspect → build workflow | T038–T040, T043, T045 |
| Plan: one-package production installation | T002–T004, T039, T042, T044–T045 |

## Implementation Strategy

1. Complete setup and foundation, retaining green graph/immutability/declaration checks after the structural and authoring migrations.
2. Deliver US1 as the MVP: compiled `build` with selection, exact files, dry-run, both formats and truthful failure summaries. Validate independently before expanding scope. Installed delivery and complete help are US4 work, not implied by the US1 checkpoint.
3. Add US2 and then US3 as separately verifiable increments; neither requires generated build artifacts. Continue to run earlier acceptance coverage.
4. Complete US4 for help, installed binary and full automation guarantees, then documentation, supported-platform CI and final evidence.
5. Do not add a module registry, custom resolver, persistent cache, graph mutation, incremental builds, stale-file cleanup, watch mode, image renderer, publication workflow, or attribute-registration framework.
