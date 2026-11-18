# Feature Specification: CLI Tool

**Feature Branch**: `005-cli-tool`

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "Open feature 005 — CLI tool, eventually bundled with the core in one package. Provide build to export diagrams into a chosen distribution folder preserving source folders; list-elements to inspect all properties, including custom properties, in separate node and edge tables or JSON; and partition-info to describe partitions and all exports without elements. Select partitions by name or source-path glob and select diagram/element export keys. Design for users and AI agents."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Build Published Diagrams (Priority: P1)

A model author exports all published diagrams, or those from selected partitions, into a distribution folder for review and use by other tools.

**Why this priority**: One repeatable command turns published model views into usable artifacts without a separate export script per project.

**Independent Test**: Build a source tree containing nested partitions and multiple diagrams into a chosen folder; compare the files and their contents with the published diagrams.

**Acceptance Scenarios**:

1. **Given** nested partitions with published diagrams, **When** the author runs `build` with a destination, **Then** every selected diagram is saved under the corresponding source-relative folder, with exactly its published text.
2. **Given** several partitions, **When** the author selects by exact partition ID, exact name, source-path glob, or a combination, **Then** only diagrams belonging to matching partitions are written.
3. **Given** existing files at the generated artifact paths, **When** the author runs a build, **Then** every selected diagram is written unconditionally, overwriting any existing file at its destination without comparison or confirmation.
4. **Given** multiple diagrams mapping to the same destination file, **When** the build runs, **Then** each write overwrites that file and the last diagram in deterministic build order supplies its final contents.
5. **Given** a write failure after some files have been saved, **When** the build finishes, **Then** it reports a concise error and a summary of partitions and diagrams processed so far and the total files exported, then exits unsuccessfully.
6. **Given** a partition publishing diagrams with `.mmd` and `.puml` extensions, **When** the author builds, **Then** each file uses its own declared extension and retains its exact published text; a missing or invalid extension fails before writing.
7. **Given** selected partitions with or without diagrams, **When** the author builds, **Then** the command outputs a simple summary listing the partitions and diagrams processed and the total number of exported files; partitions without diagrams are included and a build with no diagrams reports zero files.

---

### User Story 2 - Inspect Exported Elements (Priority: P1)

A user or AI agent inspects a partition's named element collections or diagram selections to understand nodes, relationships, and custom model data without reading internal source files.

**Why this priority**: Element inspection provides the substantive model data needed for analysis and agent-assisted work.

**Independent Test**: List an export containing nodes and edges with different custom properties in table and JSON formats, then verify membership, values, endpoints, and export provenance.

**Acceptance Scenarios**:

1. **Given** an export with nodes and edges and heterogeneous custom properties, **When** the user runs `list-elements`, **Then** separate node and edge tables expose all authored business attributes, including properties present on only some members.
2. **Given** element and diagram exports sharing a key, **When** the user selects that key within its export group, **Then** only the requested collection or diagram data is shown.
3. **Given** no export-key filter, **When** the user lists selected partitions, **Then** all their element and diagram selections appear separately with partition identity, source path, export group, and key.
4. **Given** string, numeric, null, and undefined attributes, missing endpoints, and distinct elements sharing an author-assigned ID, **When** an agent requests JSON, **Then** the result is parseable, preserves strings, numbers, and null, maps explicit undefined attributes to null, and represents endpoint references separately without recursive expansion or invented domain IDs.
5. **Given** an empty export, **When** it is listed, **Then** it appears as an empty selection; an unknown requested key instead produces an actionable failure.
6. **Given** elements with business attributes and framework navigation getters, **When** they are inspected, **Then** their business attributes and model types are shown without evaluating unrelated getters or exposing hidden state.
7. **Given** selected attributes `name` and `description`, **When** elements are listed in either format, **Then** only those business attributes are included while provenance, kind, model type, identity, and edge endpoints remain available; an unknown attribute fails concisely.
8. **Given** an export with five nodes and three edges, **When** a limit of two is supplied, **Then** each format shows the first two of each kind and reports node counts of five total, two returned, three omitted and edge counts of three total, two returned, one omitted.
9. **Given** a custom business-attribute method, **When** elements are inspected, **Then** only its returned business values are shown alongside mandatory identity and endpoint metadata; an invalid method result produces a concise error.
10. **Given** an edge to a node outside its export, **When** the edge is listed, **Then** its endpoint includes available business identity and model type and is marked outside the export, without adding the node to the selection.

---

### User Story 3 - Discover Partition Contributions (Priority: P1)

A user or agent obtains a compact inventory of partitions and their exports before choosing what to inspect or build, using pretty-printed output for people or JSON for automated consumers.

**Why this priority**: Discoverability makes the other commands usable without prior knowledge of source internals or export names.

**Independent Test**: Inspect a nested source tree with identity-only, vocabulary-only, and full partitions in both pretty-printed and JSON formats, and verify that both inventories match their public declarations.

**Acceptance Scenarios**:

1. **Given** valid discovered partitions, **When** `partition-info` runs, **Then** it shows each partition's name, ID, source-relative entry path, nearest discovered ancestor partition, and all element, diagram, and metamodel export keys.
2. **Given** nonempty exports, **When** partition information is requested, **Then** element and diagram selections include node/edge counts, but no element records or diagram text are included.
3. **Given** identity-only or vocabulary-only partitions, **When** they are inspected, **Then** empty export groups are explicit and available metamodel export names remain visible.
4. **Given** an ID, name, or path selector, **When** either inspection command is run, **Then** its partition selection agrees with the same selectors used by `build`.
5. **Given** selected partitions, **When** the user chooses pretty-printed or JSON output, **Then** `partition-info` presents the same partition metadata, export keys, and counts in the chosen format; pretty-printed output is the default.

---

### User Story 4 - Use the CLI Reliably in Automation (Priority: P2)

A first-time user discovers commands from help, while an agent or automated job obtains stable results and actionable failures without interactive prompts.

**Why this priority**: Predictable command behavior reduces trial and error and makes the tool suitable for automated workflows.

**Independent Test**: Follow only the built-in help to discover partitions, inspect one export, and build diagrams; repeat through redirected JSON output and exercise invalid requests.

**Acceptance Scenarios**:

1. **Given** a new user, **When** they request top-level or command help, **Then** they see required arguments, defaults, selection semantics, examples, formats, and exit-status meanings without loading model sources.
2. **Given** JSON output, **When** a command succeeds or fails, **Then** standard output contains exactly one documented result document and no progress text, colors, or source-generated log messages.
3. **Given** invalid options, an unmatched explicit selector, an invalid partition, or a loading failure, **When** a command runs, **Then** it exits unsuccessfully and identifies the cause, relevant source or selector, and a corrective action.
4. **Given** unchanged deterministic sources, **When** commands run repeatedly, **Then** result ordering and artifact contents are stable.

5. **Given** a healthy entry selected by path and an unrelated broken entry, **When** a command runs, **Then** it succeeds without loading the unrelated entry; if the selected entry imports the broken entry, the command fails with a concise error.
6. **Given** two partitions sharing a name but having different IDs, **When** a user selects one exact ID obtained from `partition-info`, **Then** only that partition is processed by any of the three commands.

### Edge Cases

- Discovery ignores supporting folders prefixed with `_`, hidden folders, dependency folders, and the chosen build destination; imported dependencies remain usable even when excluded from discovery.
- Discovery does not follow directory symlinks, avoiding traversal loops and unintended sources outside the root.
- Duplicate partition names select all matching partitions, distinguishable by ID and path. Duplicate partition IDs among loaded candidates or multiple candidate partition entries in one folder cause an explicit ambiguity error; unrelated path-excluded partitions are not loaded to enforce global ID uniqueness.
- A parent match does not implicitly select descendants; users select a subtree with a path glob.
- An empty source tree succeeds with an empty result when no selector was supplied; an explicit selector matching nothing fails.
- An element may appear in several exports. It remains present in each export; distinct elements sharing a domain ID are not merged.
- A selected edge can reference a node outside the selected collection or have an absent endpoint; inspection preserves this distinction and does not expand the selection.
- Property names may overlap with CLI metadata; custom values must remain distinguishable and intact.
- Element information is flat: strings, finite numbers, null, and undefined only. The default skips unsupported stored values without traversing them. Invalid override results or method failures produce a concise error. JSON maps explicit undefined values to null and leaves absent keys omitted.
- Source load errors in candidates needed for selection or their imports prevent a successful inspection result and prevent build writes. Broken unrelated entries excluded by a path selector do not affect the command. Later filesystem errors can yield a clearly identified partial build.
- Empty diagram strings create empty files. Notation is not inferred from content.
- Whitespace, Unicode, glob characters in names, and duplicate diagram keys across partitions must remain unambiguous.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The CLI MUST provide `build`, `list-elements`, and `partition-info` through one documented entry point suitable for eventual distribution with the core in one package, with top-level and command help and a version option.
- **FR-002**: All commands MUST accept a source root, defaulting to the current directory, and discover public `*.partition.ts` entries exporting the named `partition` value established in feature 004. Discovery MUST honor the exclusions and ambiguity rules in Edge Cases and MUST NOT require a separate partition registry.
- **FR-003**: All commands MUST support repeatable exact, case-sensitive partition-ID and partition-name selectors and repeatable glob selectors matching the entire source-root-relative entry path, including filename. Multiple selectors of one kind form a union; supplied ID, name, and path selector groups together form an intersection. With no selectors, all discovered partitions are selected. Overlapping matches MUST NOT duplicate a partition.
- **FR-004**: Path matching MUST support `*` and `?` within a path segment and `**` across directories, using `/` as the documented separator. Help MUST show quoted patterns, exact-ID and exact-name examples, combined filters, and subtree selection. Invalid patterns and any explicitly supplied selector matching no candidate within the path-filtered candidate set MUST fail; an empty combined intersection MUST also fail.
- **FR-005**: Discovery MUST derive parent relationships from the nearest ancestor partition entry within the source root, independently of selection. Parent information MUST always include its source-relative entry path; its ID and name are included only if that ancestor was loaded for the invocation. Ancestors MUST NOT be loaded solely to enrich parent metadata. Selection MUST NOT aggregate or forward child exports.
- **FR-006**: `build` MUST require a destination folder and write every named diagram of each selected partition using the exact published `inNotation` text, without regeneration, notation inference, selection cleanup, or graphical rendering.
- **FR-007**: Build paths MUST preserve each entry's containing directory relative to the source root. Each artifact MUST use its diagram export key plus the file extension declared by that diagram in the partition contract. For example, `services/service-a/service-a.partition.ts` with key `context` and extension `.mmd` produces `<destination>/services/service-a/context.mmd`. Diagrams in the same partition MAY declare different extensions.
- **FR-008**: The CLI MUST reject export keys or extensions that create path traversal, path separators, or invalid destination names. Output collisions MUST NOT cause a failure; later writes MUST overwrite earlier writes in normalized source-relative partition path order, then diagram export key order. It MUST validate selected partitions and all planned destinations before writing. The destination MUST differ from the source root, and generated artifacts MUST NOT overwrite source entries.
- **FR-009**: Build MUST create required destination folders and unconditionally write every selected diagram, overwriting existing files at its planned artifact paths without content comparison, incremental-build detection, or confirmation. It MUST output one simple summary listing processed partitions and their processed diagram keys, plus the total number of exported files. The total MUST count distinct destination files successfully written, so overwriting the same destination more than once counts as one exported file. Per-artifact status logs, progress events, and detailed logging are not required. A dry-run option MUST show the same planned paths without writing. Automatic stale-file deletion is excluded.
- **FR-010**: `list-elements` MUST support separate, repeatable selectors for exact element-export keys and diagram-export keys. No key selector means all exports in both groups. Supplied selectors form a union across those groups and apply to each selected partition; partitions without a requested key contribute no selection, and each requested key MUST match at least one selected partition or fail with available keys.
- **FR-011**: Element inspection MUST preserve export boundaries and membership, including diagram `data`, and distinguish nodes from edges. It MUST NOT invent, merge, mutate, or automatically add elements. Every selection MUST carry partition ID/name, source path, export group, and key.
- **FR-012**: Human-readable element output MUST use separate node and edge tables per export, with columns covering the union of authored business attributes in each table, restricted to requested attributes when a property selector is supplied. Model type and endpoint references MUST remain available separately from business-attribute columns. Attribute values MUST remain readable and no returned value may be silently truncated; empty groups MUST be labeled explicitly.
- **FR-013**: Model elements MUST provide `getElementInfo()` returning a flat record of strings, finite numbers, null, or undefined, with an automatic default selecting supported stored enumerable business fields such as name, description, label, and access type. It MUST exclude identity, methods, accessors, and framework fields; edges MUST exclude endpoints from this attribute record. Authors MAY override the method to omit, rename, or compute attributes. Inspection MUST use this method rather than require attribute lists on each type. Internal state MUST use private runtime storage, non-enumerable fields, or an author override; automatic recognition of TypeScript-private ordinary fields is not promised. Absent attribute keys MUST remain distinguishable from keys with null values. Explicit undefined values MAY be normalized to null for JSON. Endpoint metadata remains separate from attributes.
- **FR-014**: JSON MUST preserve string and finite numeric attribute values and null directly, normalize explicit undefined attribute values to null, and omit absent keys. No nested attribute values or special-value encoding is required; invalid overrides MUST produce a concise error. Element and endpoint references MUST include the required author-assigned `id`, available `name` or `label`, and model type, plus whether the referenced element belongs to the full selected export before limiting. References to external nodes MUST remain descriptive without requiring a separate lookup or adding those nodes to the export. Response-local references MUST distinguish objects even without unique domain IDs and MUST NOT be presented as author-assigned IDs. Metadata MUST be separate from authored properties.
- **FR-015**: `partition-info` MUST report partition ID, name, source path, parent if present, and all named exports grouped into elements, diagrams, and metamodel. Element and diagram entries MUST include separate node and edge counts; metamodel entries MUST list keys without attempting to serialize executable definitions. Element payloads and diagram text MUST be omitted. This inventory MUST support both pretty-printed human-readable output (the default) and JSON through the output-format option.
- **FR-016**: All commands MUST offer an explicit output-format option supporting a human-readable table/summary and JSON, defaulting to human-readable output. JSON MUST have a documented schema version, a success indicator, result data, and a concise error on failure, including build and dry-run results. Unsupported formats MUST fail with supported choices.
- **FR-017**: JSON mode MUST emit exactly one parseable document on standard output, including on command failures. Diagnostics and model-source log output MUST NOT contaminate it. Human-readable diagnostics MUST go to standard error. Commands MUST require no interactive prompts and MUST support plain output without color or terminal control sequences.
- **FR-018**: Commands MUST exit with zero on success and nonzero on failure. Failures MUST provide one concise error message with the relevant source, selector, export key, or destination and enough context to correct the problem. JSON MUST expose that error in a consistent field. Separate exit codes for failure categories, detailed diagnostic collections, and a logging subsystem are not required. Partial build results MUST retain a failed outcome.
- **FR-019**: Results MUST order partitions by normalized relative path and export keys and property columns consistently, while retaining source iteration order within node and edge groups. Unchanged deterministic sources MUST produce identical artifact paths, text, and JSON data, without volatile timestamps or machine-specific absolute paths in normal results.
- **FR-020**: Inspection and build MUST preserve existing publication and graph semantics and leave authored sources and shared export state unchanged. Loading MUST use the project's existing source/import conventions; failures MUST identify the relevant entry and underlying cause without substituting empty content.
- **FR-021**: Help and documentation MUST include a complete discover → inspect → build workflow, source-root and output-path rules, ID/name/path selectors, business-attribute selection, result limits and omitted counts, empty-result behavior, overwrite and dry-run behavior, output-format examples, and the fact that loading a partition executes its authored source and imports.
- **FR-022**: The partition diagram contract MUST include a required `fileExtension` string alongside `data` and `inNotation`, preserved exactly on publication. Authors MUST supply the extension including its leading dot (for example, `.mmd` or `.puml`); empty values, a lone dot, and values containing path separators are invalid. Build MUST use this value without inferring a notation or substituting a default extension. Missing or invalid extensions MUST produce an error identifying the partition and diagram key. Partition information MUST include each diagram's declared extension in both pretty-printed and JSON output. Existing diagram declarations and documentation MUST be updated to provide this metadata.

- **FR-023**: `list-elements` MUST support optional selection of exact business-attribute names, applied equally to table and JSON output. With no attribute selector it MUST include all inspectable business attributes. Each requested name MUST exist in at least one member of the full selected exports or fail with a concise error; missing values on other members MUST remain distinguishable. Partition/export provenance, element kind, model type, response-local identity, and edge endpoints MUST remain available regardless of attribute selection.
- **FR-024**: `list-elements` MUST accept an optional positive integer result limit, applied independently to each export's node and edge group after preserving source order. With no limit it MUST return all members. Both output formats MUST report total, returned, and omitted counts per group, including groups with no members. Limits MUST NOT alter the underlying export or partition-info counts. Invalid limits MUST fail. Limited output MUST be explicitly identified and MUST NOT silently discard values from returned records.
- **FR-025**: Every inspected element MUST include its model type, such as Service, Database, or Calls, separately from node/edge kind and business attributes (including an authored attribute named `type`). If no specific model type is available, output MUST explicitly indicate that rather than inventing a domain type. Endpoint summaries MUST follow the same rule. Defining how authors expose business attributes and model-type information is part of planning this feature.
- **FR-026**: When path selectors are present, the CLI MUST filter discovered entry paths before loading partition values, then apply ID/name selectors to those candidates. It MUST NOT load unrelated entries solely for discovery, parent metadata, or validation. Ordinary imports of candidates remain permitted and their failures affect the command. Without path selectors, ID/name selection may require loading all discovered candidates; help MUST explain this distinction.

- **FR-027**: Every model element, including nodes and edges, MUST have a readonly author-assigned string `id`. Authors own ID uniqueness; the framework MUST NOT generate IDs, enforce element-ID uniqueness, or merge objects with matching IDs. CLI output MUST retain identity independently of business-attribute selection. Existing declarations and call sites without IDs MUST be migrated.

### Key Entities

- **Discovered Partition**: A public partition value with identity, source-relative entry path, folder-derived parent, and named export groups.
- **Partition Selection**: The partitions matching the shared name and path rules for an invocation.
- **Export Selection**: One named element set or diagram data set, retained with its partition and export-group context.
- **Element Record**: A node or edge's model type, authored business attributes, and explicit references, associated with its export selection.
- **Partition Summary**: Identity, hierarchy, export inventory, and counts without element payloads or diagram text.
- **Build Artifact**: A published diagram's unchanged text and planned or written destination, using its declared file extension.
- **Command Result**: Human-readable or structured results with diagnostics and a corresponding exit status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a reference tree with at least three nested partitions and two diagrams per contributing partition, 100% of selected diagrams are written at the expected source-relative paths with exact published text; where destinations collide, the last write determines the final contents. Zero unselected diagrams are written.
- **SC-002**: Without explicit attribute selection or a result limit, element inspection reports 100% of selected members and authored business attributes, preserves export provenance, and distinguishes every node, edge, and missing endpoint correctly.
- **SC-003**: Partition inventories report 100% of published export keys and correct counts while containing zero element payloads or diagram text.
- **SC-004**: An automated consumer can determine success or failure, a concise error when applicable, selected data, and the build summary (processed partitions, diagrams, and exported-file total) from each JSON invocation without parsing terminal tables or removing extraneous output.
- **SC-005**: Using only built-in help and the documented example, a new user can discover partitions, inspect one chosen export, and build its partition's diagrams within ten minutes without writing a custom script.
- **SC-006**: Three repeated runs over unchanged deterministic sources produce identical ordered result data and diagram contents; dry runs produce zero filesystem changes.
- **SC-007**: Every failure and empty-result case defined above produces the specified outcome and actionable context, with zero false successful-build reports or writes outside the destination.

- **SC-008**: All limited-output examples report exact total, returned, and omitted counts in both formats; attribute selection retains 100% of mandatory context while excluding unrequested business attributes.
- **SC-009**: Every model-type and external-endpoint example supplies the expected type and available business identity, and inspection invokes zero unexposed getters or graph-navigation computations.
- **SC-010**: Path-filtered commands succeed in every example with a broken unrelated entry and fail when that entry is an actual imported dependency; exact-ID selection consistently identifies the intended partition across all commands.

## Assumptions

- Feature 005 is explicitly requested despite the deferred roadmap directory numbered 999. Its directory is `specs/005-cli-tool`; branch `005-cli-tool` was created when planning was requested.
- Features 001–004 supply graph elements, diagram text, immutable published collections, and partition entries. Feature 005 adds discovery and a dedicated CLI while retaining the existing library workflows.
- “All exports without elements” means an inventory of all three export groups, with useful counts, excluding element records, executable metamodel definitions, and full diagram text.
- “Diagram/element key” means a named export key. Business-attribute selection is a separate output option. Filtering individual elements by domain ID remains deferred; selecting partitions by ID is included.
- Build reporting is a concise final summary, with a concise error if the operation fails; no detailed logging subsystem is required.
- Table and JSON are the initial output formats. CSV, YAML, image rendering, watch mode, publishing, scaffolding, and interactive browsing are outside this feature.
- This feature extends the partition diagram contract with required `fileExtension` metadata. Existing diagram declarations must be migrated. The author chooses the extension appropriate to the published text; no global extension override or automatic notation detection is required.
- Sources are locally trusted authored models. Discovery exclusions do not sandbox imported code or prohibit ordinary cross-partition imports; no custom module registry, dependency resolver, or source-code sandbox is introduced.
- “Properties” means the flat record returned by getElementInfo(): string, finite number, null, or undefined values only. The default treats own enumerable data fields as business data, excluding identity and framework fields; authors override it for exceptions or computed values. Ordinary TypeScript-private fields require an override or different storage to remain hidden. Element ID uniqueness is an author responsibility; partition-selection ambiguity rules remain separate.
- Packaging must accommodate eventual bundling with the core in one package; renaming or publishing the current package and choosing release mechanics are outside this specification.
