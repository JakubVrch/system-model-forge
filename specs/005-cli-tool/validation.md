# CLI feature validation

Validated 2026-11-23 on Linux with Node v24.20.0 and Yarn 1.22.22 available.
Local evidence covers the CLI convergence tasks T046–T053. The restored workflow
configures Linux, macOS, and Windows jobs. Remote CI results were not observed
during this validation.

## Commands and results

| Check | Result |
| --- | --- |
| `bash .specify/scripts/bash/check-prerequisites.sh --json --paths-only` | Active feature resolved to `specs/005-cli-tool`. |
| `bash .specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` | Passed. All required design artifacts were available. |
| Requirements checklist | 16 checked, zero unchecked. |
| `npm run typecheck` | Passed with no errors. |
| `npm test` | 37 test files, 209 tests passed with no type errors, including the production-only package install. |
| `npm run build` | Passed. The core, CLI, and declarations compiled. |
| `git diff --check` | Passed. |

## Subprocess timing

The original five-invocation inventory test passed in 14.6 seconds in the full
suite and 6.2 seconds in isolation. Its full-suite time approached the
15-second test budget. The same assertions now run in an inventory case and
three selector-specific cases. The longest inventory case took 4.8 seconds in
the final full run. The test and subprocess timeout settings stayed at 15 seconds.

## Compiled quickstart

Executed `node dist/cli/main.js` for top-level help/version and all three command
help pages. Ran the quickstart inventory, inspection, projection, path/diagram
selection, dry-run, and real-build commands against
`tests/integration/fixtures/microservice-environment`. Output destinations were
fresh temporary directories cleaned after validation, replacing `.tmp/cli-diagrams`.

- Inventory in both formats reported all six partitions.
- Service A `localModel --property name --limit 2 --format json` reported node
  total/returned/omitted counts 3/2/1 and edge counts 6/2/4.
- Path `services/service-a/*.partition.ts` with `--diagram eventOverview` succeeded.
- Pretty and JSON dry-runs left the destination nonexistent and reported two
  planned files and zero exported files.
- Three successive JSON inventory, projected inspection, and build runs were
  byte-identical. Each build reported two exported files. Both generated
  `services/service-{a,b}/eventOverview.mmd` files matched UTF-8 bytes from the
  authored `inNotation` values loaded independently through tsx.
- A further pretty build succeeded and overwrote the same outputs.
- Missing partition ID, missing element-export key, and zero limit each exited 1
  with one JSON failure, `success:false`, and `data:null`.

## Installed consumer

The passing `tests/integration/cli-package.test.ts` packed the built package and
installed the tarball into a fresh temporary consumer using
`npm install --omit=dev --no-audit --no-fund`. It ran the installed `model-forge`
binary for help, version, partition-info, list-elements, and build in JSON mode.
All succeeded; generated text matched exactly. The consumer imported the public
package root at runtime and compiled a declaration consumer. The package contained
compiled core/child/declarations and runtime tsx, without repository source or Vitest.
No global package installation or publication occurred.

## Acceptance coverage

The passing unit and integration suite covers strict options, bounded globs,
path-first isolation, nearest/explicit tsconfig aliases, shared source graph
identity, malformed exports/IPC and early child exit, source-output forwarding,
cleanup with authored timers, duplicate names and IDs, empty trees/exports,
unknown keys/properties, independent group limits, and endpoint membership.
Core and inspection tests cover skipped getters, runtime-private/non-enumerable
state, unsupported stored values, invalid/thrown overrides, undefined/null,
duplicate authored element IDs, graph protocol versions, immutable publications,
and unchanged adjacency behavior. Inspection preserves membership by object
and emits the authored ID in `identity.id`. Regressions cover removal of generated
refs, preservation of authored `attributes.ref`, once-per-object inspection,
projected endpoint metadata, and complete counts. Pretty output renders
150,000 rows without dropping members, and injected rendering failures are
covered for stderr and single-document JSON behavior.

Build coverage verifies exact bytes, multipart extensions, empty diagrams,
unconditional overwrites, stale-file preservation, deterministic collisions,
complete preflight, source protection, symlink rejection, dry-run without output,
and truthful first-failure partial summaries. Added compiled integration cases
exercise Unicode and spaces, POSIX result paths, actual volume case sensitivity,
and linked destination rejection. Unit and compiled regressions reject artifacts
hard-linked to path-excluded source entries before the first write. Ordinary
hard-linked output files still count as one destination. Filename checks cover
the 255-byte UTF-8 boundary, including the extension.

## CI and setup

`.github/workflows/ci.yml` configures Node 24 on ubuntu-latest, macos-latest,
and windows-latest. Each job installs with the existing Yarn lockfile and runs
typecheck, the full test suite (including production installation), and build. Platform tests
probe actual filesystem case behavior rather than assuming it from OS names.
Temporary roots are canonicalized; directory-link tests use junctions on Windows;
path expectations and npm command launching account for Windows semantics.

The repository's `.gitignore` covers Node outputs, dependencies, logs, environment
files, and editor/temporary artifacts. No Docker, ESLint, Prettier, Terraform, or
Helm ignore configuration is applicable. The private package has a `files` allowlist
for `dist/`; publication is outside this feature.

`.specify/extensions.yml` was absent at pre- and post-implementation checks, so no
extension hooks were registered or dispatched.
