# Data Model: CLI Tool

## Authored contracts

- **Partition**: Existing id/name and element/diagram/metamodel maps; named public `partition` export. Optional contribution inputs still normalize to empty maps.
- **PartitionDiagram**: Existing immutable data/text plus required `fileExtension`. Publication preserves all values and membership; filenames are derived only at build time.
- **ModelElement**: Required readonly author-assigned string ID and getElementInfo() method. Automatic own-data defaults exclude identity and framework fields; overrides customize business output. No ID-uniqueness enforcement or constructor profile registration.
- **Graph kind**: Immutable versioned Node/Edge prototype protocol, distinct from model type and business attributes. Shared symbol identity bridges source and compiled core copies without merging model instances.

See [core-contract.md](contracts/core-contract.md) for names, validation, typing, and invalid identity/business-method behavior.

## Invocation and transient records

| Entity | Fields and relationships | Validation |
| --- | --- | --- |
| Invocation | command, root, format, tsconfig, IDs/names/paths, command-specific options | Strict options; positive limit; build out required |
| Entry inventory | absolute internal path, normalized relative path, parent entry path | Pruned directories, no symlink traversal, candidate-folder ambiguity |
| Loaded candidate | entry plus partition value | Required public contract; unique candidate IDs |
| Selected export | partition provenance, group, key, full source membership | Requested keys must match; empty exports valid |
| Element view | response ref, kind, modelType, identity, business values, endpoints | Business-method record, required ID, author-owned uniqueness |
| Group result | total, returned, omitted, ordered items | returned + omitted = total; limit applies independently |
| Endpoint view | response ref, modelType, business identity, inExport | Absent endpoint null; membership from full selected export |
| Build plan item | partition path, diagram key, exact text, output-relative path | Valid extension/name, containment, no source overwrite |
| Build summary | processed partitions/diagram keys, exportedFiles; optional dry-run plan | Unique successful destinations counted; no false success |
| Command result | schemaVersion, command, success, data, error | Exactly one parent-produced document; error null on success |

All live graph instances remain in the loading process. Parent receives normalized results or diagram text/planned paths over IPC. The public JSON contract excludes absolute paths in normal results, internal runtime state, methods, and live objects.

## Processing transitions

1. **Parsed**: validate options without importing models; help/version finish here.
2. **Discovered**: collect eligible paths and ancestry, then apply path selectors.
3. **Loaded**: one shared loader evaluates candidates and their ordinary dependencies. Any required loading failure aborts before build writes.
4. **Selected**: apply ID/name predicates; validate explicit matches and partition contracts. No-match explicit requests fail; implicit empty discovery succeeds.
5. **Normalized**: inventory counts or selected export records. Call and cache the business method once per object needed for selected records or endpoint summaries. Validate attribute requests against full selected membership before limiting; limits bound output, not method evaluation. Build instead creates a complete ordered diagram plan.
6. **Preflighted (build)**: verify every destination and existing symlink component without writing. Dry-run finishes with plan and zero exported files.
7. **Written (build)**: sequential unconditional writes; update summary only after successful writes. Stop on first failure and preserve partial summary.
8. **Rendered**: parent emits pretty output or one JSON result and exits 0/1; close child resources.

No registry, ownership mutation, global domain-ID resolver, cache, or persistent lifecycle is introduced. Business-method results are readonly snapshots; custom overrides are author-declared pure reads. Invocation failure does not undo trusted source side effects; it does prevent CLI build writes before preflight completes. A write failure does not roll back completed files.

## Determinism and projection

Order partition paths, group names (`elements` before `diagrams`), export keys, and attribute names ordinally. Preserve source membership order within separate node/edge groups. Repeated export membership remains visible separately. Response refs preserve object identity across the entire result. Attribute projection never removes identity/type/endpoint metadata. Limiting affects returned records only; full membership governs counts and endpoint `inExport`.

Element information contains strings, finite numbers, null, and undefined only; see [output-contract.md](contracts/output-contract.md). JSON normalizes explicit undefined to null while absent keys stay omitted. The default skips unsupported stored values; invalid override results fail inspection. Empty business record, invalid business-method result, empty export, missing export, no candidates, and unmatched explicit selection have separate defined outcomes.
