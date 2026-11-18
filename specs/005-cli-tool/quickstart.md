# CLI Validation Quickstart

This is the validation guide for the planned implementation. The CLI commands and new test files below become runnable after implementation; planning has not added the executable.

## Prerequisites and setup

Use Node >=24 and install repository dependencies with its chosen package manager. Run from the repository root. The fixture migration must add diagram `fileExtension` values and author-assigned IDs on all elements as described in [core-contract.md](contracts/core-contract.md).

```bash
npm run typecheck
npm test
npm run build
node dist/cli/main.js --help
node dist/cli/main.js --version
```

Expected: all checks pass; help/version require no model evaluation. The package version is reported without renaming the current package. The reorganized library builds to `dist/core/index.js` with declarations at `dist/core/index.d.ts`; package-root imports and `@core` source aliases still expose the same public library symbols.

## Discover partitions

```bash
node dist/cli/main.js partition-info --root tests/integration/fixtures/microservice-environment
node dist/cli/main.js partition-info --root tests/integration/fixtures/microservice-environment --format json
```

Expected: six fixture partitions, including the identity-only root and vocabulary-only services partition. Every export key and node/edge count agrees with the fixture. Diagram inventories include `.mmd` after migration. No element payloads or diagram text appear. Both formats represent the same data.

## Inspect business attributes and select by ID

```bash
node dist/cli/main.js list-elements --root tests/integration/fixtures/microservice-environment --partition-id service-a --elements localModel
node dist/cli/main.js list-elements --root tests/integration/fixtures/microservice-environment --partition-id service-a --elements localModel --property name --limit 2 --format json
node dist/cli/main.js list-elements --root tests/integration/fixtures/microservice-environment --path 'services/service-a/*.partition.ts' --diagram eventOverview --format json
```

Expected: separate node/edge groups, business attributes only, model type and endpoint identity retained. Service A localModel currently has three nodes and six edges: limit two returns two of each with one omitted node and four omitted edges. Property projection retains mandatory metadata. Endpoints to shared topics/databases remain descriptive without inserting those nodes into localModel. An endpoint omitted only by a limit is still inExport when it belongs to the full export.

## Preview and build diagrams

```bash
node dist/cli/main.js build --root tests/integration/fixtures/microservice-environment --out .tmp/cli-diagrams --dry-run
node dist/cli/main.js build --root tests/integration/fixtures/microservice-environment --out .tmp/cli-diagrams --format json
node dist/cli/main.js build --root tests/integration/fixtures/microservice-environment --out .tmp/cli-diagrams
```

Expected: two diagrams, at `services/service-a/eventOverview.mmd` and `services/service-b/eventOverview.mmd`, with exact authored text. Dry-run creates no destination files/directories and reports two planned, zero exported. A normal run reports processed partitions/diagram keys and two exported files. Re-running unconditionally rewrites the same files and produces equivalent content and counts. No incremental checks or confirmation prompts occur.

Dry-run evaluates trusted source and imports; it prevents tool-managed artifact/cache writes, not arbitrary side effects in authored code.

## Error and isolation checks

```bash
node dist/cli/main.js partition-info --root tests/integration/fixtures/microservice-environment --partition-id does-not-exist --format json
node dist/cli/main.js list-elements --root tests/integration/fixtures/microservice-environment --partition-id service-a --elements absent --format json
node dist/cli/main.js list-elements --root tests/integration/fixtures/microservice-environment --limit 0 --format json
```

Expected: each exits 1 and emits one parseable JSON failure with a concise contextual error. Tests must also cover unknown attributes, invalid extensions, missing IDs or invalid business-method results, invalid flags, child early exit, and malformed partition exports.

Add focused fixtures in `tests/integration/fixtures/cli/` for the following subprocess scenarios rather than modifying the main example to simulate failures:

- A selected healthy entry beside an unrelated broken entry: path-filtered command succeeds; importing the broken entry fails.
- Authored `console.log` and direct stdout writes: JSON stdout still parses as exactly one document; source messages appear on stderr.
- Two definitions sharing dependency objects: references and membership remain identical across source imports, including source `@core` versus compiled CLI classification.
- Private runtime/non-enumerable fields and throwing getters: defaults neither expose nor evaluate them. Own business fields work automatically; custom business-method overrides can omit fields and return computed values. Ordinary TypeScript-private enumerable fields require an override to hide them.
- Five nodes and three edges, duplicate domain IDs, absent/external endpoints, custom `type`, strings, finite integers/decimals, null, and undefined: validate native JSON values, undefined-to-null normalization, and omitted-key behavior. Verify that defaults skip richer stored values and invalid override values fail clearly.
- Mixed `.mmd`/`.puml` files, empty diagrams, identity-only partitions, planned destination collisions, and an output symlink escape: validate exact text, last-write-wins, counts, and containment.
- A destination failure after an earlier successful write: one concise error, exit 1, and truthful partial file total. Use a deterministic filesystem obstruction rather than permissions that differ under root.

## Installed-package smoke validation

After building, the integration smoke test must pack the package into a temporary directory, install that tarball in a fresh temporary consumer with production dependencies only, create/import a small public-package model, and run its installed `model-forge` binary for all three commands. Assert that the child executable and tsx runtime dependency are included, core library exports still work, and no repository source paths or development dependencies are needed. Keep all generated consumer artifacts in temporary storage and clean up after the test; do not publish or globally install the package.

## Completion evidence

Run typecheck, the complete test suite, and build, then the compiled and installed CLI checks. Compare three unchanged JSON runs and generated files for deterministic results. Cross-platform CI must cover path separators, Unicode/space names, and output collisions on the host filesystem. Record results in the implementation report; this guide itself is not evidence that implementation tests passed.
