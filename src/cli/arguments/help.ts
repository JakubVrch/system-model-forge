import { OUTPUT_SCHEMA_VERSION } from '@cli/result';
import { DEFAULT_OUTPUT_FORMAT, outputFormats } from '@cli/arguments/options';

export const helpText = `model-forge — inspect and build authored model partitions

Usage: model-forge <command> [options]

Commands:
  partition-info   Inventory identity, parents, exports, counts and extensions.
  list-elements    Inspect element exports and diagram data as separate groups.
  build            Write published diagram text.

Shared options:
  --root <directory>        Source root (default: current working directory).
  --format ${outputFormats.join('|')}      Output format (default: ${DEFAULT_OUTPUT_FORMAT}). JSON schemaVersion ${OUTPUT_SCHEMA_VERSION}.
  --tsconfig <file>         Source tsconfig (default: nearest upward from root).
  --partition-id <id>       Repeatable exact, case-sensitive literal ID.
  --partition-name <name>   Repeatable exact, case-sensitive literal name.
  --path <glob>             Repeatable root-relative entry path, including filename.
  --help, -h                Show help without loading sources.
  --version                Show version without loading sources.

list-elements options:
  --elements <key>          Repeatable exact element-export key.
  --diagram <key>           Repeatable exact diagram-export key. Combines with --elements.
  --property <name>         Repeatable exact business attribute (default: all).
  --limit <positive-int>    Limit nodes and edges independently per export.
                           Default: all. Counts show total, returned and omitted.
                           Identity, model type and endpoints survive projection.

  Without export filters, all element and diagram exports are included.
  Empty exports are shown. Properties must exist in full selected membership,
  even before limits are applied.

build options:
  --out <directory>         Required destination, different from the source root.
                           Relative paths resolve from the working directory.
  --dry-run                Validate and show planned paths without writing CLI artifacts.
                           Authored source and imports still execute.

  Writes unconditionally overwrite existing files in path/key order. The last
  write wins and each distinct successful destination counts once.
  Output path: <out>/<entry folder>/<diagram key><declared fileExtension>.
  Discovery skips the destination subtree. Existing files outside the plan
  stay in place. Invalid plans write nothing. Write failures report partial totals.

Selection:
  Values form a union within each selector kind and an intersection across kinds.
  IDs and names are literal, including glob characters. Selecting a parent
  does not select its descendants.
  Quote path globs: 'services/**' selects a subtree and '*.partition.ts' selects
  root entries. Use * and ? within a segment, and ** for zero or more segments.
  Patterns disallow traversal, absolute paths, backslashes, brackets, braces,
  and extglobs.
  Path selectors filter entries before loading. ID and name selectors can load
  all candidates. Ordinary imports may still execute excluded entries.
  Discovery skips dot folders, underscore-prefixed support folders, node_modules,
  and symlinks. An empty root with no selectors succeeds. Unmatched selectors fail.
  --root and --tsconfig resolve from the working directory.

Execution and automation:
  Loading executes trusted authored TypeScript and its imports.
  Source stdout and stderr go to stderr. JSON stdout contains one document
  followed by a newline. Output is plain and commands run without prompts.
  Exit 0 means success. Exit 1 means failure with a contextual diagnostic.

Workflow:
  model-forge partition-info --root ./model
  model-forge list-elements --root ./model --partition-id service-a --elements localModel --property name --limit 2 --format json
  model-forge build --root ./model --partition-id service-a --out ./artifacts --dry-run
  model-forge build --root ./model --out ./artifacts --format json`;
