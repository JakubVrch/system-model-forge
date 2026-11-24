# Research: CLI Tool

Research completed 2026-11-17 against the active specification, constitution 1.1.0, source contracts, and microservice fixtures. Independent research covered source loading/packaging and business-attribute inspection. All planning unknowns are resolved below.

## 1. Runtime and source loading

**Decision:** Retain Node >=24, TypeScript strict NodeNext, and the current compilation pipeline. Add `tsx` as a runtime dependency. Resolve its installed preload from the CLI package and enable it once in a child process for each invocation; dynamically import all candidate partition entries in that process. Discover the nearest `tsconfig.json` upward from the source root, with an explicit `--tsconfig` override resolved from the caller's working directory. Supply the resolved configuration through `TSX_TSCONFIG_PATH`. Disable tsx's disk cache for these invocations.

**Rationale:** Existing model classes use parameter properties and fixtures use `@core` path aliases. Native Node type stripping does not use tsconfig paths. One registration preserves module caching and shared graph objects across entries. Keep typechecking separate from execution. The tsx integration supports loading user TypeScript through an established loader, and each `tsImport()` call has its own namespace, so separate calls per partition would risk duplicate model instances. See [Node TypeScript support](https://nodejs.org/api/typescript.html), [tsx integration](https://tsx.hirok.io/dev-api/), and [tsx import lifecycle](https://tsx.hirok.io/dev-api/ts-import).

**Alternatives considered:** Native stripping fails the existing alias workflow; precompiling every consumer project adds setup and output management; a custom resolver duplicates host tooling. Separate loaders per entry break shared identity. No bundler or compiler service is introduced.

## 2. Arguments, discovery, and matching

**Decision:** Use Node `util.parseArgs` for options, explicit command dispatch, `fs.readdir` with directory entries for discovery, and `path.posix.matchesGlob` for normalized source-relative patterns. Advertise the bounded `*`, `?`, and whole-segment `**` grammar; reject absolute paths, `..` segments, backslashes, and unsupported bracket/brace/extglob syntax before matching. Sort using code-unit comparison, not locale-sensitive collation. Exact ID/name selectors remain literal strings.

**Rationale:** Three commands do not justify a command framework. Explicit directory traversal prunes `_` support folders, dot folders, `node_modules`, symlinks, and the build destination without loading models. Native argument parsing supports strict options and repeated values. [Node argument parsing](https://nodejs.org/download/release/v24.0.0/docs/api/util.html#utilparseargsconfig) and [Node path matching](https://nodejs.org/download/release/v24.12.0/docs/api/path.html#pathmatchesglobpath-pattern) provide the required primitives; `matchesGlob` exists at the current Node floor although its stable designation arrived later in Node 24.

**Alternatives considered:** Broad glob syntax and a dedicated glob dependency add unnecessary contract surface. Directory scanning itself remains local application logic; matching is not reimplemented.

## 3. Output isolation and responsibility split

**Decision:** Parent handles parsing, path discovery, rendering, destination preflight, and writing. A single child loads candidates, filters IDs/names, validates partition values, and normalizes command data. IPC carries only JSON-compatible DTOs and diagram text; no live graph crosses the boundary. Child stdout/stderr are drained to parent stderr. The parent alone writes the result document to stdout and maps outcomes to exit 0/1. Unexpected child exit becomes a concise failure. Help/version never start the child.

**Rationale:** Console interception misses direct stdout writes. A process boundary isolates output while preserving the graph within one process; it is not a security sandbox. Build writes begin only after a complete validated plan is received. Disable loader caching so dry-run has no CLI-managed disk writes. [Node child processes](https://nodejs.org/download/release/v24.22.1/docs/api/child_process.html) support IPC and separate standard streams.

**Alternatives considered:** Patching console is incomplete; passing graph objects through IPC loses behavior and identity; a daemon is unnecessary. The command is finite: close the child after its result is received so authored background handles do not keep the CLI alive. Propagate interruption and clean up the child.

## 4. Business data and identity (revised by author decision)

**Decision:** Require author-assigned readonly string IDs on ModelElement, with no element-ID uniqueness enforcement. Provide `getElementInfo()` with automatic own-enumerable-data discovery, excluding identity/framework fields and edge endpoints. Authors override it only for exceptions. Keep defineElement unchanged. Retain the graph-kind symbol for source/compiled recognition; use class names as descriptive model types rather than introducing a metadata registration API.

**Rationale:** Existing EventFlow business data is simply its stored `kind` field; a repeated allowlist adds needless authoring. Runtime enumeration cannot distinguish TypeScript-private ordinary fields, so the accepted convention is that internal state uses #private/non-enumerable storage or an override. TypeScript visibility limitations are documented in the [class handbook](https://www.typescriptlang.org/docs/handbook/2/classes.html). IDs remain outside projected attributes and supply endpoint identity without name guessing. Duplicate IDs do not change object identity or trigger validation errors.

**Alternatives considered:** Mandatory attribute profiles were rejected as intrusive. A separate attributes storage object changes authoring substantially. An abstract method requires boilerplate on every class. The chosen concrete method supplies a useful default with explicit customization, evaluated only after construction.

## 5. Serialization and bounded output

**Decision:** Normalize selected exports once into node/edge groups. Validate requested attribute names against cached method results for full selected membership; limit independently per group; retain complete counts and export membership for endpoints. Preserve distinct members by object identity and expose their authored IDs directly. Include endpoint business identity, model type, and full-export membership even when output attributes are projected. Limit getElementInfo() values to strings, finite numbers, null, and undefined. Default discovery skips other stored values; invalid override values fail. Normalize undefined to null in JSON, preserving its key. No recursive value serializer or tagged encoding is needed.

**Rationale:** Agents need finite, meaningful references and ordinary typed JSON values; users need the same content in readable tables. Model IDs are mandatory but their uniqueness is author-managed. Limits constrain returned records, not the model's membership. Encoding rules are fixed in the output contract.

**Alternatives considered:** A general tagged serializer for arbitrary objects was rejected as unnecessary complexity. Normalize undefined to null before ordinary JSON serialization; richer domain values are the author's responsibility to convert. Global element-ID merging corrupts source identity.

## 6. Diagram extension, build, and package delivery

**Decision:** Add required `fileExtension` to PartitionDiagram, copy it unchanged in definePartition, and migrate all diagrams/type fixtures. Use sequential unconditional writes ordered by source path then diagram key. Same destination means last write wins. Count distinct successfully written destination files; stop at the first write error and return the simple partial summary. Dry-run reports planned paths and zero exported files. Destination checks reject escaping paths and symlinked output components, not ordinary overwrites.

Move all existing library folders and the library barrel beneath `src/core`, neighboring `src/cli`. Update source aliases and package root export targets to `src/core/index.ts` and `dist/core/index.js`/`index.d.ts` respectively, preserving consumer import names. Keep the compiler root at `src`. Keep one package and add binary `model-forge` targeting `dist/cli/main.js`, including the compiled child and tsx runtime dependency. Do not rename/publish the private package. Installation smoke coverage must exercise a packed copy with production dependencies, not only source execution.

**Rationale:** Extensions belong to each authored diagram, not an invocation-wide guess. This changes a public required field and needs release compatibility notes; publication mechanics remain deferred. Sequential writes make overwrite behavior deterministic. Core and CLI remain in the same package with independent entry points.

**Alternatives considered:** Content-based extension inference is unreliable; incremental builds, stale-file cleanup, and collision errors contradict the requested simple overwrite behavior. Separate packages are unnecessary.
