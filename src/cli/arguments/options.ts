import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { CliError } from '@cli/errors';

export const BUILD_COMMAND = 'build';
export const LIST_ELEMENTS_COMMAND = 'list-elements';
export const PARTITION_INFO_COMMAND = 'partition-info';
export const TRACE_ELEMENT_COMMAND = 'trace-element';
export const HELP_ACTION = 'help';
export const VERSION_ACTION = 'version';

const commands = [BUILD_COMMAND, LIST_ELEMENTS_COMMAND, PARTITION_INFO_COMMAND, TRACE_ELEMENT_COMMAND] as const;
const actions = [...commands, HELP_ACTION, VERSION_ACTION] as const;
export const DEFAULT_OUTPUT_FORMAT = 'pretty';
export const JSON_OUTPUT_FORMAT = 'json';
export const outputFormats = [DEFAULT_OUTPUT_FORMAT, JSON_OUTPUT_FORMAT] as const;

export type Command = typeof commands[number];
export type OutputFormat = typeof outputFormats[number];
export type Action = Command | typeof HELP_ACTION | typeof VERSION_ACTION;

type CommandTarget =
  | { command: typeof BUILD_COMMAND; out: string }
  | { command: typeof TRACE_ELEMENT_COMMAND; elementId: string; depth: number; out?: never }
  | { command: Exclude<Action, typeof BUILD_COMMAND | typeof TRACE_ELEMENT_COMMAND>; out?: string };

export type Invocation = CommandTarget & {
  root: string;
  format: OutputFormat;
  tsconfig?: string;
  ids: string[];
  names: string[];
  paths: string[];
  elements: string[];
  diagrams: string[];
  properties: string[];
  limit?: number;
  dryRun: boolean;
};

const FORMAT_OPTION = 'format';

const sharedOptions = {
  root: { type: 'string' },
  [FORMAT_OPTION]: { type: 'string' },
  tsconfig: { type: 'string' },
  'partition-id': { type: 'string', multiple: true },
  'partition-name': { type: 'string', multiple: true },
  path: { type: 'string', multiple: true },
} as const;

const InfoOptions = {
  [HELP_ACTION]: { type: 'boolean', short: 'h' },
  [VERSION_ACTION]: { type: 'boolean' },
} as const;

const commandOptions = {
  [TRACE_ELEMENT_COMMAND]: { depth: { type: 'string' } },
  [BUILD_COMMAND]: {
    out: { type: 'string' },
    'dry-run': { type: 'boolean' },
  },
  [LIST_ELEMENTS_COMMAND]: {
    elements: { type: 'string', multiple: true },
    diagram: { type: 'string', multiple: true },
    property: { type: 'string', multiple: true },
    limit: { type: 'string' },
  },
} as const satisfies Partial<Record<Command, object>>;

const options = { ...sharedOptions, ...InfoOptions, ...commandOptions[BUILD_COMMAND], ...commandOptions[LIST_ELEMENTS_COMMAND], ...commandOptions[TRACE_ELEMENT_COMMAND] };
const repeatable = new Set(Object.entries(options)
  .filter(([, option]) => 'multiple' in option && option.multiple)
  .map(([name]) => name));

export function recognizedCommand(args: string[]): Action | null {
  return actions.find(action => action === args[0]) ?? null;
}
/** Recover the output choice even if strict parsing rejects a different argument. */
export function requestedFormat(args: string[]): OutputFormat {
  const terminator = args.indexOf('--');
  const beforeTerminator = args.slice(0, terminator < 0 ? args.length : terminator);
  const flag = `--${FORMAT_OPTION}`;
  const wantsJson = beforeTerminator.some((arg, index) =>
    arg === `${flag}=${JSON_OUTPUT_FORMAT}` || (arg === flag && beforeTerminator[index + 1] === JSON_OUTPUT_FORMAT));
  return wantsJson ? JSON_OUTPUT_FORMAT : DEFAULT_OUTPUT_FORMAT;
}
function positiveInteger(value: string, option: string): number {
  const number = Number(value);
  if (!/^[0-9]+$/.test(value) || !Number.isSafeInteger(number) || number < 1) {
    throw new CliError(option + ' must be a positive integer');
  }
  return number;
}

export function parseOptions(args: string[], cwd = process.cwd()): Invocation {
  const command = recognizedCommand(args);
  const activeOptions = { ...options };
  const supported = command === TRACE_ELEMENT_COMMAND ? { ...sharedOptions, ...commandOptions[TRACE_ELEMENT_COMMAND] }
    : command === HELP_ACTION || command === VERSION_ACTION ? { format: sharedOptions.format }
    : options;
  for (const key of Object.keys(activeOptions)) {
    if (!Object.hasOwn(supported, key)) Reflect.deleteProperty(activeOptions, key);
  }
  const { values, positionals, tokens } = parseArgs({
    args: command ? args.slice(1) : args,
    strict: true,
    allowPositionals: true,
    tokens: true,
    options: activeOptions,
  });
  const elementId = positionals[0];
  const allowedPositionals = command === TRACE_ELEMENT_COMMAND ? 1 : 0;
  if (positionals.length > allowedPositionals) throw new CliError(`Unexpected command or positional argument: ${positionals[allowedPositionals]}`);
  const seen = new Set<string>();
  for (const token of tokens) {
    if (token.kind !== 'option') continue;
    if (seen.has(token.name) && !repeatable.has(token.name)) throw new CliError(`Option --${token.name} may only be supplied once`);
    seen.add(token.name);
    for (const [owner, allowedOptions] of Object.entries(commandOptions)) {
      if (command !== owner && Object.hasOwn(allowedOptions, token.name)) {
        throw new CliError(`--${token.name} requires ${owner}`);
      }
    }
  }
  const format = outputFormats.find(choice => choice === values.format);
  if (values.format !== undefined && !format) {
    throw new CliError(`Unsupported format; supported choices: ${outputFormats.join(', ')}`);
  }
  const selectors = (values: string[] | undefined): string[] => {
    if (values?.some(value => value.length === 0)) throw new CliError('Selectors must not be empty');
    return [...new Set(values ?? [])];
  };
  for (const key of ['root', 'out', 'tsconfig'] as const) {
    if (values[key] === '') throw new CliError(`--${key} must not be empty`);
  }
  const limit = values.limit === undefined ? undefined : positiveInteger(values.limit, '--limit');
  const action = values.version ? VERSION_ACTION : values.help || args.length === 0 ? HELP_ACTION : command;
  if (!action) throw new CliError(`Expected command: ${commands.join(', ')}`);
  const out = values.out === undefined ? undefined : resolve(cwd, values.out);
  let target: CommandTarget;
  if (action === BUILD_COMMAND) {
    if (!out) throw new CliError('build requires --out <directory>');
    target = { command: action, out };
  } else if (action === TRACE_ELEMENT_COMMAND) {
    if (!elementId) throw new CliError('trace-element requires exactly one nonempty element ID');
    const depth = values.depth === undefined ? 1 : positiveInteger(values.depth, '--depth');
    target = { command: action, elementId, depth };
  } else {
    target = { command: action, out };
  }

  return {
    ...target,
    root: resolve(cwd, values.root ?? '.'),
    format: format ?? DEFAULT_OUTPUT_FORMAT,
    tsconfig: values.tsconfig === undefined ? undefined : resolve(cwd, values.tsconfig),
    dryRun: values['dry-run'] ?? false,
    limit,
    ids: selectors(values['partition-id']),
    names: selectors(values['partition-name']),
    paths: selectors(values.path),
    elements: selectors(values.elements),
    diagrams: selectors(values.diagram),
    properties: selectors(values.property),
  };
}
