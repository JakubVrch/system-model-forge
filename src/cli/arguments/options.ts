import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { CliError } from '@cli/result';

export const BUILD_COMMAND = 'build';
export const LIST_ELEMENTS_COMMAND = 'list-elements';
export const PARTITION_INFO_COMMAND = 'partition-info';
export const HELP_ACTION = 'help';
export const VERSION_ACTION = 'version';

const commands = [BUILD_COMMAND, LIST_ELEMENTS_COMMAND, PARTITION_INFO_COMMAND] as const;
export const DEFAULT_OUTPUT_FORMAT = 'pretty';
export const JSON_OUTPUT_FORMAT = 'json';
export const outputFormats = [DEFAULT_OUTPUT_FORMAT, JSON_OUTPUT_FORMAT] as const;

export type Command = typeof commands[number];
export type OutputFormat = typeof outputFormats[number];
export type Action = Command | typeof HELP_ACTION | typeof VERSION_ACTION;

type CommandTarget =
  | { command: typeof BUILD_COMMAND; out: string }
  | { command: Exclude<Action, typeof BUILD_COMMAND>; out?: string };

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
  [HELP_ACTION]: { type: 'boolean', short: 'h' },
  [VERSION_ACTION]: { type: 'boolean' },
} as const;

const commandOptions = {
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

const options = { ...sharedOptions, ...commandOptions[BUILD_COMMAND], ...commandOptions[LIST_ELEMENTS_COMMAND] };
const repeatable = new Set(Object.entries(options)
  .filter(([, option]) => 'multiple' in option && option.multiple)
  .map(([name]) => name));

export function recognizedCommand(args: string[]): Command | null {
  return commands.find(command => command === args[0]) ?? null;
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
export function parseOptions(args: string[], cwd = process.cwd()): Invocation {
  const command = recognizedCommand(args);
  const { values, positionals, tokens } = parseArgs({
    args: command ? args.slice(1) : args,
    strict: true,
    allowPositionals: true,
    tokens: true,
    options,
  });
  if (positionals.length) throw new CliError(`Unexpected command or positional argument: ${positionals[0]}`);
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
  let limit: number | undefined;
  if (values.limit !== undefined) {
    limit = Number(values.limit);
    if (!/^[0-9]+$/.test(values.limit) || !Number.isSafeInteger(limit) || limit < 1) throw new CliError('--limit must be a positive integer');
  }
  const action = values.version ? VERSION_ACTION : values.help || args.length === 0 ? HELP_ACTION : command;
  if (!action) throw new CliError(`Expected command: ${commands.join(', ')}`);
  const out = values.out === undefined ? undefined : resolve(cwd, values.out);
  let target: CommandTarget;
  if (action === BUILD_COMMAND) {
    if (!out) throw new CliError('build requires --out <directory>');
    target = { command: action, out };
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
