# Quickstart Validation: Define Model Partitions

## Prerequisites

Use Node.js >=24 and the repository's installed development dependencies. If dependencies are absent, run `npm ci` at the repository root. The API and all six fixture entries are implemented; the commands below run against the current repository.

Read the public shapes and authoring restrictions in [the partition contract](contracts/partition-contract.md), and the publication lifecycle in [the data model](data-model.md).

## Inspect the authoring convention

Open the fixture's root `microservice-environment.partition.ts`: it declares identity
only. Inspect `topics/` and `databases/` for owned definitions and instances, and
`services/` for shared vocabulary. Its `service-a/` and `service-b/` children publish
local selections and event diagrams. There are no inherited exports or forwarding
barrels. Supporting folders have `_` prefixes; files retain ordinary names.

## Run focused validation

From the repository root:

```sh
npm run typecheck
npm test -- tests/unit/define-partition.test.ts tests/integration/microservice-environment.test.ts
```

Type checks include `tests/type/partition.test-d.ts` through the repository tsconfig. Expected compile-time coverage: exact keys and set subtypes, no exposed collection mutators, preserved definition argument tuples and `.is` narrowing, plus optional groups and expected errors for missing identity/name and malformed declarations.

Expected runtime outcomes:

1. Consumers obtain all named exports from the entry point; collection membership and reference identity match expectations.
2. Changing caller-owned sets, mappings, or diagram records after publication leaves the published partition unchanged.
3. Mutation attempts on publication containers and collection membership fail without changing the published structure.
4. Model values, endpoints, and definition guards pass through unchanged; publication does not inspect payloads or invoke element getters. Authors maintain immutable model state.
5. A new edge connecting published nodes appears in a fresh adjacency read. Earlier adjacency snapshots and named element/diagram sets remain unchanged.
6. Service A/B diagram exports retain the existing Service A/B selections and exact expected text. Empty data/text and absent keys behave as documented.
7. The microservice test uses existing query operations, compares `exportDiagram` output with published `inNotation`, and saves that published text using `saveDiagram` to a temporary directory. Readback must match expected text exactly; tests clean up their temporary files.
8. Focused fixture tests verify local publication boundaries and shared topic/database references. Core unit tests cover snapshot stability and mutation resistance.

## Complete regression and build validation

```sh
npm test
npm run build
```

Expected outcome: existing graph, shallow `defineElement`, selection, and export tests still pass. Generated declarations expose `definePartition`, `Partition`, and `PartitionDiagram` from the package root with preserved generic information. Build artifacts remain governed by existing repository ignore conventions.

No framework CLI, filesystem discovery, dependency registry, or output regeneration is needed to consume the partition. README instructions should reproduce this workflow using ordinary imports and explain the supported immutable-data contract.

## Historical implementation records

The records below describe the initial recursive-protection implementation. That
contract was subsequently replaced at the user's request: publication now protects
only its containers and membership. Deep-freeze, payload-error, preflight, and endpoint
protection claims in these historical records are superseded by the current contract.
The recursive helper and its dedicated tests have been removed.

## Phases 1–4 implementation record (2026-11-16)

Baseline: `npm run typecheck`, `npm test` (16 files, 61 tests, no type errors), and `npm run build` all passed. No pre-existing failures were observed.

Migration inventory (for phase 5; no files moved in phases 1–4):

- `tests/integration/microservice-environment.test.ts` consumes the fixture root barrel, which forwards the service A/B barrels.
- `service-a/index.ts` and `service-b/index.ts` consume `@metamodel` plus infrastructure topic/database barrels through `@fixtures`.
- `infrastructure/topics/index.ts` and `infrastructure/databases/index.ts` consume `@metamodel`.
- `tests/type/define-element.test-d.ts`, `filter-set.test-d.ts`, and `union-set.test-d.ts` consume `@metamodel`.
- `tsconfig.json` and `vitest.config.ts` both map `@metamodel` to the old root metamodel barrel. Remove or align both aliases during migration; replace child authoring imports with the independent services metamodel entry and infrastructure imports with explicit partition entries. Root consumers should use the root partition entry. The `@fixtures` mappings currently target barrel conventions and must be reviewed for explicit partition paths.

Setup verification: existing `.gitignore` covers Node dependencies, build outputs, logs, and environment files. The package is private; no publication ignore file is needed. No Docker, ESLint, Prettier, Terraform, or Helm configuration requires additional ignore files.

Completed phases 1–4 (T001–T014): typed partition publication, publication-wide own-data preflight, immutable element/diagram membership snapshots, definition surface protection, and a local two-diagram export/save scenario. Failing tests were observed before each behavior increment. Final validation: `npm run typecheck` passed; `npm test` passed all 19 files / 86 tests with no type errors; `npm run build` passed and emitted the public generic declarations. Existing Service A/B expected diagram strings remain unchanged. The public-surface assertion now includes `definePartition`. No extension hook configuration was present. Phases 5–6 were completed subsequently, as recorded below.


## Phases 5–6 implementation record (2026-11-16)

Completed T015–T027. The six-entry tree matches plan.md, including empty infrastructure
diagram barrels and the independent services metamodel barrel. All fixture consumers
now use explicit partition entries; obsolete infrastructure/service barrels and the
`@metamodel`/`@fixtures` aliases were removed. Shared definitions and model instances
retain identity without duplicate declarations. Child imports do not reference root
or services assembly.

The acceptance test first failed on the missing root partition entry. After migration,
both existing expected diagram strings pass unchanged, regenerated text matches the
published text, and saved UTF-8 text matches byte for byte. The same test verifies all
six identities, ordered singleton/aggregate memberships, shared definitions and topic
references, mutation resistance, and 100 stable reads.

Validation results:

- `npm run typecheck`: passed.
- Focused validation command above: 3 files, 25 tests passed.
- `npm test`: 19 files, 87 tests passed; no type errors.
- `npm run build`: passed. Inspected `dist/index.d.ts` and
  `dist/partition/define-partition.d.ts`: all three public exports are present;
  mapped generics retain exact keys/member subtypes, readonly collection results,
  and original metamodel callable signatures. Build output remains ignored.
- `git diff --check`: passed.

Reviewed publication implementation against the public contract: complete preflight,
in-place alias/endpoint protection, untouched prototypes, live adjacency, and unchanged
`defineElement` semantics remain intact. README documents the supported plain-data and
pure-behavior boundary and runnable fixture consumption. No extension hook configuration
was present before or after implementation. Requirements checklist markers were not edited.


## Current contract revision validation (2026-11-16)

Removed recursive publication protection at the user's request. Publication protects
only its shell, mappings, diagram records, and membership snapshots; authors maintain
immutable model state. Revised tests first failed against the old implementation,
then passed with model data, endpoints, getters, and guards untouched through parent
aggregation. Removed the helper and obsolete deep-protection tests.

`npm run typecheck`, `npm test` (18 files, 74 tests, no type errors), and
`npm run build` all passed. Both original service diagrams still match exactly.
`git diff --check` passed. Historical test counts above refer to the superseded contract.


## Local contribution and layout revision validation (2026-11-17)

Optional-group runtime coverage first failed on omitted mappings. After implementation,
`npm run typecheck`, `npm test` (18 files, 76 tests, no type errors), and `npm run build`
passed. Both service diagrams retain their exact expected text and saved output.
Generated declarations preserve optional inputs, exact inferred output keys, and
broad `Partition` annotations. `git diff --check` passed.

The fixture now has 21 files instead of 39, using direct child folders, named
partition entries, underscore-prefixed support folders, and local contributions
only. No CLI scanner or delegation contract implementation is included.


## Integration test simplification

Removed repeated-read loops, duplicated publication mutation assertions, fixture
counts, and the synthetic diagram/save scenario. The real service diagrams retain
exact generation/save coverage. Focused tests cover local publication boundaries
and cross-partition vocabulary, shared topic, and database references. Historical
validation records above describe the coverage at the time of those revisions.
