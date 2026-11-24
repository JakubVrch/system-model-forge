# CLI Contract

Executable: `model-forge`, packaged with the existing core. Development equivalent after build: `node dist/cli/main.js`. Names below are the planned public interface, not commands already implemented.

## Commands and options

| Command | Purpose | Specific options |
| --- | --- | --- |
| `build` | Write every diagram from selected partitions | `--out <directory>` required; `--dry-run` optional |
| `list-elements` | Inspect named element exports and diagram data | Repeatable `--elements <key>`, `--diagram <key>`, `--property <name>`; optional `--limit <positive-integer>` |
| `partition-info` | Inventory partitions and export keys/counts/extensions | No command-specific options |

Shared options:

| Option | Behavior |
| --- | --- |
| `--root <directory>` | Source discovery root; current working directory by default |
| `--partition-id <id>` | Repeatable exact case-sensitive partition ID |
| `--partition-name <name>` | Repeatable exact case-sensitive partition name |
| `--path <glob>` | Repeatable source-root-relative entry-path pattern including filename |
| `--format pretty\|json` | Default `pretty`; JSON structure is in output-contract.md |
| `--tsconfig <file>` | Explicit source project tsconfig; otherwise nearest tsconfig upward from root, or ordinary loader defaults if none exists |
| `--help`, `-h` | General help without loading source, with or without a command |
| `--version` | Installed package version without loading source |

Paths supplied as root, out, or tsconfig resolve relative to the caller's working directory. Reject unknown options, unexpected positional arguments, command-inapplicable options, repeated singleton options, empty selectors, and invalid limits. Both `--option value` and `--option=value` are supported. A recognized JSON format request must be honored even when another argument is invalid. Help/version with JSON produce the standard envelope with help/version data; an unsupported format produces a plain concise error because no supported representation was selected. All output is plain, without ANSI controls or interactive prompts.

## Selection and discovery

1. Walk entry paths without executing source. Exclude `_`-prefixed support folders, dot folders, node_modules, symlink entries, and the canonical build destination subtree. Keep ancestry paths for parent reporting. The explicitly supplied root itself is not excluded because of its basename.
2. Validate glob grammar: `*`/`?` within a segment, `**` as a whole segment matching zero or more segments; `/` separates segments. Reject absolute paths, `..`, backslashes, and unsupported bracket/brace/extglob syntax. Name and ID values are literal, including glob characters. Use normalized POSIX paths for matching, case-sensitive comparison, and ordinal sorting.
3. With path options, union their matches before loading. Each requested path must match an entry; empty intersection results are errors. Without paths, all entries are candidates.
4. Load only candidate entries and their ordinary imports through one shared loader. Validate the named `partition` contract. ID/name selectors can require loading all candidates; they cannot isolate broken candidates the way path filters can. Imported dependencies need not be discovered entries.
5. Union within each ID/name option kind; intersect supplied kinds and the path candidates. Each ID/name value must match at least one path candidate before the intersection, and the final selection must be nonempty when any partition selector was given.
6. Duplicate names are allowed. Duplicate IDs among explicit loaded candidates and multiple candidate entries in one directory fail. Imported but unselected dependencies are not promoted into the result or a global duplicate-ID registry.
7. Parents derive from entry paths, not imports or registration. A parent outside the root is not reported. Parent path is available even if it was not loaded; ID/name appear only for loaded candidates. An invalid ancestor value excluded by path does not force a load or block the selected child; its entry path is sufficient for parent reporting.

No selectors plus no discovered partitions returns a successful empty result. A parent match does not include descendants. Quote glob patterns in the shell.

## Inspection

No export-key filters means all element and diagram exports, separately identified. `--elements` and `--diagram` select exact keys in their respective groups; their results form a union. Every requested key must occur in at least one selected partition; absence from other partitions is normal. Empty sets remain visible.

Business attributes come from getElementInfo(), with its automatic default or author override. IDs are mandatory metadata and are not selected using --property. `--property` projects attributes without removing provenance, kind, modelType, authored identity, or edge endpoints. Each requested attribute must be returned by at least one member of the full selected exports; validate before limiting. With empty selections, explicit property requests have no matching member and fail; without projection, empty selections succeed.

`--limit N` applies independently to node and edge groups in each export. Preserve source iteration order inside those groups. Full totals, returned counts, and omitted counts are always reported. Property names are ordered ordinally, including explicit projection. Repeated selector values are deduplicated. No silent value truncation occurs; multiline cells wrap/escape visibly and very wide tables may extend beyond terminal width.

## Build

Plan `<out>/<entry-directory-relative-to-root>/<diagram-key><fileExtension>`. Sort partitions by normalized path and diagram keys ordinally. Validate all selected contracts and destinations first; lexical containment and real filesystem checks must prevent escape through symlink components. Reject output root equal to source root and artifacts targeting source entries. Existing ordinary files at planned paths are overwritten unconditionally. No cleaning, content comparison, incremental state, or collision failure.

Write sequentially and stop at the first I/O failure. Every successful write marks that diagram processed; an entered partition with zero diagrams remains in the summary. The failed diagram is identified by the concise error. Repeated destination paths count once in `exportedFiles`, and the final successful write wins. The summary lists processed partition IDs/names/paths and diagram keys, plus the file total; no per-artifact statuses or progress logs.

Dry-run validates the same plan, outputs every planned diagram key/path and distinct `plannedFiles`, and reports `exportedFiles: 0`. It creates no destination directories or CLI caches. Source evaluation still occurs; authored side effects cannot be prevented by dry-run and are documented.

## Errors and process behavior

Exit 0 on success, 1 for handled failures. No category-specific exit codes. JSON is exactly one document followed by a newline. Source stdout and stderr are forwarded to stderr; never mix them with result stdout. The parent renders one failure if the child exits without a valid result. Inspection failure returns no partial inspection data; write failure may return the simple partial build summary. Errors include a concise message and relevant context, not a stack trace by default. Help documents the complete workflow, defaults, overwritten files, source execution, and all selector semantics.
