import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { CliError, type Command, type Invocation } from './result.ts';

const commands: Command[] = ['build', 'list-elements', 'partition-info'];
export function recognizedCommand(args: string[]): Command | null {
  return commands.includes(args[0] as Command) ? args[0] as Command : null;
}
/** Recover the output choice even if strict parsing rejects a different argument. */
export function requestedFormat(args: string[]): 'json' | 'pretty' {
  const beforeTerminator = args.slice(0, args.indexOf('--') < 0 ? args.length : args.indexOf('--'));
  return beforeTerminator.some((arg, i) => arg === '--format=json' || (arg === '--format' && beforeTerminator[i + 1] === 'json')) ? 'json' : 'pretty';
}
export function parseOptions(args: string[], cwd = process.cwd()): Invocation {
  const command = recognizedCommand(args);
  const { values, positionals, tokens } = parseArgs({ args: command ? args.slice(1) : args, strict: true, allowPositionals: true, tokens: true, options: {
    root: { type: 'string' }, format: { type: 'string' }, tsconfig: { type: 'string' },
    'partition-id': { type: 'string', multiple: true }, 'partition-name': { type: 'string', multiple: true }, path: { type: 'string', multiple: true },
    elements: { type: 'string', multiple: true }, diagram: { type: 'string', multiple: true }, property: { type: 'string', multiple: true },
    limit: { type: 'string' }, out: { type: 'string' }, 'dry-run': { type: 'boolean' }, help: { type: 'boolean', short: 'h' }, version: { type: 'boolean' },
  } });
  if (positionals.length) throw new CliError(`Unexpected command or positional argument: ${positionals[0]}`);
  const repeatable = new Set(['partition-id', 'partition-name', 'path', 'elements', 'diagram', 'property']);
  const seen = new Set<string>();
  for (const token of tokens) if (token.kind === 'option') {
    if (seen.has(token.name) && !repeatable.has(token.name)) throw new CliError(`Option --${token.name} may only be supplied once`);
    seen.add(token.name);
    if (['out', 'dry-run'].includes(token.name) && command !== 'build') throw new CliError(`--${token.name} requires build`);
    if (['elements', 'diagram', 'property', 'limit'].includes(token.name) && command !== 'list-elements') throw new CliError(`--${token.name} requires list-elements`);
  }
  if (values.format !== undefined && !['pretty', 'json'].includes(values.format)) throw new CliError('Unsupported format; supported choices: pretty, json');
  const selectors = (values: string[] | undefined): string[] => {
    if (values?.some(value => value.length === 0)) throw new CliError('Selectors must not be empty');
    return [...new Set(values ?? [])];
  };
  for (const key of ['root', 'out', 'tsconfig'] as const) if (values[key] === '') throw new CliError(`--${key} must not be empty`);
  let limit: number | undefined;
  if (values.limit !== undefined) {
    limit = Number(values.limit);
    if (!/^[0-9]+$/.test(values.limit) || !Number.isSafeInteger(limit) || limit < 1) throw new CliError('--limit must be a positive integer');
  }
  const action = values.version ? 'version' : values.help || args.length === 0 ? 'help' : command;
  if (!action) throw new CliError('Expected command: build, list-elements, partition-info');
  if (action === 'build' && !values.out) throw new CliError('build requires --out <directory>');
  return { command: action, root: resolve(cwd, values.root ?? '.'), format: values.format === 'json' ? 'json' : 'pretty',
    tsconfig: values.tsconfig === undefined ? undefined : resolve(cwd, values.tsconfig), out: values.out === undefined ? undefined : resolve(cwd, values.out),
    dryRun: values['dry-run'] ?? false, limit, ids: selectors(values['partition-id']), names: selectors(values['partition-name']), paths: selectors(values.path),
    elements: selectors(values.elements), diagrams: selectors(values.diagram), properties: selectors(values.property) };
}

export function helpText(command: Command | null): string {
  return `${command ? `model-forge ${command}\n\n` : 'model-forge — inspect and build authored model partitions\n\n'}Commands:
  partition-info   Inventory identity, parents, exports, counts and extensions.
  list-elements    Inspect element exports and diagram data as separate groups.
  build            Write published diagram text; requires --out <directory>.

Shared options:
  --root <directory>        Source root (default: current working directory).
  --format pretty|json      Output format (default: pretty); JSON schemaVersion 1.
  --tsconfig <file>         Source tsconfig (default: nearest upward from root).
  --partition-id <id>       Repeatable exact, case-sensitive literal ID.
  --partition-name <name>   Repeatable exact, case-sensitive literal name.
  --path <glob>             Repeatable root-relative entry path, including filename.
  --help, -h                Show help without loading sources.
  --version                Show installed version without loading sources.

list-elements options:
  --elements <key>          Repeatable exact element-export key.
  --diagram <key>           Repeatable exact diagram-export key; union with elements.
  --property <name>         Repeatable exact business attribute (default: all).
  --limit <positive-int>    Limit nodes and edges independently per export.
                           Default: all; total/returned/omitted counts remain visible.
                           Identity, model type and endpoints survive projection.

build options:
  --out <directory>         Required destination, different from the source root.
  --dry-run                Validate and show planned paths, write no CLI artifacts.
                           Sources still execute; authored side effects can occur.
  Writes unconditionally overwrite existing files in path/key order. Last collision
  wins; distinct successful destinations count once. No stale-file deletion.
  Paths: <out>/<entry folder>/<diagram key><declared fileExtension>.
  Invalid plans write nothing; write failures report partial completed totals.

Selection:
  Values form a union within each selector kind and an intersection across kinds.
  ID/name values are literal, including glob characters. A parent does not select
  descendants. Quote path globs: 'services/**' selects a subtree; '*.partition.ts'
  selects root entries. Supported: segment * and ?, whole-segment ** (zero or more
  segments). No traversal, absolute paths, backslashes, brackets, braces or extglobs.
  Path filtering happens before loading; ID/name selection can load all candidates.
  Excluded entries can still execute through ordinary imports. Discovery prunes
  dot/support folders, node_modules, symlinks and the build destination subtree.
  No selectors and no entries succeeds empty; explicit unmatched selectors fail.
  No export filters selects all element and diagram exports; empty sets are shown.
  Properties must exist in full selected membership, even before limits.
  root/out/tsconfig resolve relative to the caller's current working directory.

Execution and automation:
  Loading executes trusted authored TypeScript and its imports. Dry-run is not a
  source sandbox. Source stdout/stderr goes to stderr. JSON stdout is exactly one
  document plus newline. Plain output has no ANSI styling or interactive prompts.
  Exit 0 means success; exit 1 means failure. Diagnostics have contextual errors.

Workflow:
  model-forge partition-info --root ./model
  model-forge list-elements --root ./model --partition-id service-a --elements localModel --property name --limit 2 --format json
  model-forge build --root ./model --partition-id service-a --out ./artifacts --dry-run
  model-forge build --root ./model --out ./artifacts --format json`;
}
