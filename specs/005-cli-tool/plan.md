# Implementation Plan: CLI Tool

**Branch**: `005-cli-tool` | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/005-cli-tool/spec.md`

## Summary

Provide `model-forge build`, `list-elements`, and `partition-info` in the core package. Share path-first discovery and ID/name/path selection. Load authored TypeScript in one tsx-enabled child per invocation, preserving shared graph instances and isolating model output from the parent's JSON response. Inspect getElementInfo() results using automatic defaults and optional author overrides; require author-assigned element IDs without enforcing uniqueness. Extend partition diagrams with required file extensions. Build sequentially with unconditional overwrites and a concise summary.

## Technical Context

**Language/Version**: TypeScript ^5.8.3, strict NodeNext, ES2023; Node >=24 (local research environment v24.20.0).

**Primary Dependencies**: Existing graph/partition APIs, Node argument/path/filesystem/child-process APIs, new runtime dependency `tsx` (compatible version selected and locked during implementation). Existing Vitest and TypeScript tooling remain.

**Storage**: Authored source files, in-memory graphs/results, generated diagram files; no database, persistent registry, or CLI cache.

**Testing**: Vitest unit/integration tests, type/declaration tests, subprocess tests of the compiled executable, and a packed-package installation smoke test.

**Target Platform**: Node ESM command line on Linux, macOS, and Windows; portable `/` paths in results and selectors, native filesystem paths internally.

**Project Type**: Existing library plus CLI in one package; no separate service.

**Performance Goals**: Directory discovery proportional to visited entries; inspect selected memberships only, never recursively traverse adjacency. Limits bound returned records per group. No unsupported latency promise; use the existing six-partition fixture and focused larger-selection cases to measure counts and avoid accidental graph expansion.

**Constraints**: Immutable graph publication, deterministic ordering/text, no custom module resolver, no source writes, no image rendering, no detailed logging, no background daemon. Authored source remains trusted executable code.

**Scale/Scope**: Three commands, one package binary, mandatory element IDs, a default business-attribute method and graph-kind recognition, one required diagram field, migration of existing fixtures/docs, and focused acceptance validation. No implementation or tasks generation in this stage.

## Constitution Check

Pre-research gate: PASS. Post-design gate: PASS. No exceptions requested.

| Principle | Design evidence |
| --- | --- |
| I. Model-as-Source | Entries and automatic business-attribute defaults and overrides remain authored source; output is disposable. |
| II. Graph-First | Source object identity and node/edge membership remain intact; reference DTOs do not mutate graphs or resolve missing endpoints. |
| III. Package-Bounded | Core publishes small typed contracts; CLI uses entry modules and native imports, not internal author files. |
| IV. Immutable Shared Exports | Publication shells remain frozen; inspection uses business-attribute snapshots without mutating elements or selections. Authors keep overrides pure. |
| V. Deterministic Builds | Ordered selection, exact text, deterministic last-write-wins behavior, repeatability tests, preflight plus honest partial failure. |
| VI. Host-Language First | Native options/filesystem/process APIs, established tsx loader, TypeScript typing, symbols and ordinary imports. No compiler/reflection framework or module registry. |

Before implementation changes, add failing contract/behavior tests. Validate public declarations and freezing, fixture composition, compiled CLI results, and exact generated files. Required element IDs and `fileExtension` are breaking public contract additions: migrate local consumers and document the release impact; do not publish or choose a release number here.

## Project Structure

### Documentation (this feature)

```text
specs/005-cli-tool/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── cli-contract.md
│   ├── output-contract.md
│   └── core-contract.md
└── checklists/requirements.md
```

`tasks.md` is intentionally deferred to the tasks stage.

### Source Code (repository root)

```text
src/
├── cli/
│   ├── main.ts              # executable, parse/dispatch/render, exit handling
│   ├── options.ts           # option definitions and validation
│   ├── discover.ts          # directory inventory, ancestry, path filters
│   ├── child.ts             # tsx-enabled entry loading, normalization, IPC
│   ├── select.ts            # ID/name and export selectors
│   ├── inspect.ts           # business method results, references, limits
│   ├── build.ts             # destination preflight and sequential writes
│   ├── format.ts            # pretty tables/summaries from normalized DTOs
│   └── result.ts            # internal request/result types
└── core/
    ├── collection/          # existing readonly-set and union-set modules
    ├── element/             # all existing element/adjacency modules
    │   ├── model-element.ts # required ID and getElementInfo default
    │   ├── define-element.ts # existing factory contract retained
    │   ├── node.ts          # required ID and graph-kind protocol
    │   └── edge.ts          # required ID and graph-kind protocol
    ├── export/              # existing diagram export and saving
    ├── partition/           # define-partition.ts with required fileExtension
    ├── query/               # existing selection/navigation queries
    └── index.ts             # library barrel, including inspection exports

tests/
├── unit/                    # business method, identity, partition field, matching, flat attribute validation, formatting
├── type/                    # required IDs/factory inference, required extension, public declarations
└── integration/
    ├── cli.test.ts          # compiled subprocess behavior and artifacts
    ├── cli-package.test.ts  # installed package executable with production dependencies
    └── fixtures/           # migrated microservice model and focused error/inspection fixtures
```

**Structure Decision**: Move the entire existing library into `src/core`, including `collection`, `element`, `export`, `partition`, `query`, and its `index.ts` barrel. Keep `src/cli` as its sibling in the same package. Core must not import CLI modules; the CLI consumes core contracts. All model loading/inspection remains within a single process. Add `bin` and tsx runtime dependency to package.json; preserve public package-root imports and exported library symbols while updating their build targets. Update the repository's existing lockfile(s) according to its package-manager policy, without introducing another lockfile. README documents the invocation, migration, and trusted-source execution model.

### Layout migration

- Move existing library files together, preserving their internal relative layout. Move `src/index.ts` to `src/core/index.ts`.
- Update `@core` to `./src/core/index.ts` and `@core/*` to `./src/core/*.ts` in tsconfig and any matching test-runner aliases. Update direct source imports in tests, examples, and tooling.
- Set the production compiler root to `src` so outputs remain predictably `dist/core/**` and `dist/cli/**`. Point package `main`, `types`, and root `exports` at `dist/core/index.js` and `dist/core/index.d.ts`; the binary remains `dist/cli/main.js`.
- Audit declaration tests, package smoke tests, documentation, and tooling for old source/build paths. Consumers continue importing the package root or the existing `@core` alias.
- Validate the structural move with existing tests and type/declaration checks before adding CLI behavior; installed-package validation must exercise the relocated core entry point as well as the CLI.

## Phase 0: Research Results

[research.md](research.md) resolves source loading, configuration selection, module identity, stdout isolation, glob grammar, automatic business-attribute defaults and overrides, reference encoding, extension migration, and package delivery. No unresolved clarification remains. Research records the accepted stored-field convention and its visibility limitations and separate per-partition loader namespaces.

## Phase 1: Design and Validation

[data-model.md](data-model.md) defines objects and processing order. Contracts define flags, core APIs, normalized results, errors, and flat attribute normalization. [quickstart.md](quickstart.md) is the post-implementation run guide.

Implementation sequence for later task generation:

1. Relocate the existing library to `src/core` and update aliases, imports, build targets, and package entry points; verify existing behavior. Add identity/business-method/kind and required-extension contract tests; implement constructor and extension migration while retaining construction inference/freezing.
2. Add command parsing/discovery/filter tests and source child loading with alias/shared-identity and stdout isolation checks.
3. Implement partition summaries, business-attribute inspection, reference encoding, limits, and pretty/JSON formatting.
4. Implement dry-run/preflight and sequential overwrite build with minimal summary and partial failure behavior.
5. Wire the package binary and migrate all examples; validate compiled and installed CLI workflows, document compatibility changes.

| Requirements | Planned evidence |
| --- | --- |
| FR-001–005, FR-026 | Help, version, strict options, ID/name/glob combinations, path-first broken-entry isolation, excluded folders, parent paths, duplicate candidates. |
| FR-006–009, FR-022 | Mixed extensions, exact bytes, unconditional overwrite, collisions, destination containment/symlinks, no-diagram and partial-write summaries, dry-run. |
| FR-010–014, FR-023–025 | Export-key groups, automatic field discovery, hidden storage exclusions, business-method overrides, required IDs, custom type attribute, endpoint identity, duplicate domain IDs, flat string/number/null/undefined values, property projection, exact limit counts. |
| FR-015–019 | Both formats, no payload in inventory, JSON parseability under direct source stdout writes, deterministic results, concise errors/exit 1. |
| FR-020–021, FR-027 | Existing graph behavior and immutability suite, tsconfig aliases, packed installation, README and quickstart walkthrough. |

Run `npm run typecheck`, `npm test`, and `npm run build` during implementation. Exercise the compiled binary after building and the packed installation outside the repository to detect accidental source/dev-dependency reliance. Platform-sensitive path behavior needs CI coverage on supported hosts. This plan does not claim those future checks have run.

## Complexity Tracking

No constitution violations. The child process exists solely for output isolation and a shared source-loading lifetime. The automatic business-attribute method uses an explicit authoring convention and allows overrides; it does not infer TypeScript visibility. Neither adds a persistent registry, resolver, or governance engine.
