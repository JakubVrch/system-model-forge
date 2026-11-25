import { expect, it } from 'vitest';
import { resolve } from 'node:path';
import { parseOptions, requestedFormat } from '@cli/arguments/options';
it('defaults and resolves paths from cwd, unions repeated selectors and accepts both syntaxes', () => {
  const result = parseOptions(['build', '--out=out', '--root', 'source', '--partition-id=a', '--partition-id', 'a', '--partition-id=b'], '/tmp');
  expect(result).toMatchObject({ root: resolve('/tmp', 'source'), out: resolve('/tmp', 'out'), ids: ['a', 'b'], format: 'pretty', dryRun: false });
  expect(parseOptions(['partition-info']).root).toBe(resolve('.'));
  expect(parseOptions(['list-elements', '--limit=2', '--property=x']).limit).toBe(2);
});
it.each([
 ['build'], ['build', '--out=a', '--out=b'], ['partition-info', '--dry-run'], ['build', '--out=a', '--limit=2'],
 ['partition-info', '--root=a', '--root=b'], ['partition-info', 'extra'], ['unknown'], ['partition-info', '--wat'],
 ['partition-info', '--partition-id='], ['partition-info', '--path='], ['list-elements', '--property='],
 ...['0', '-1', '1.5', '1e2', 'Infinity', '9007199254740993'].map(n => ['list-elements', `--limit=${n}`]),
])('rejects invalid invocation %j', (...args) => { expect(() => parseOptions(args)).toThrow(); });
it('honors recognized JSON even when another argument is invalid', () => {
  expect(requestedFormat(['build', '--bad', '--format=json'])).toBe('json');
  expect(requestedFormat(['build', '--format', 'json', '--bad'])).toBe('json');
  expect(requestedFormat(['--format=yaml'])).toBe('pretty');
});

it('uses one trace hop by default and accepts an explicit positive depth', () => {
  expect(parseOptions(['trace-element', 'root'])).toMatchObject({ elementId: 'root', depth: 1 });
  expect(parseOptions(['trace-element', 'root', '--depth', '3'])).toMatchObject({ elementId: 'root', depth: 3 });
});

it.each([
  ['--depth'], ['--depth=0'], ['--depth=-1'], ['--depth=1e2'], ['--depth=9007199254740992'], ['--depth=1', '--depth=2'],
].map(options => [options]))('rejects malformed trace depth %j', options => {
  expect(() => parseOptions(['trace-element', 'root', ...options])).toThrow();
});

it('parses standalone actions and exact trace IDs', () => {
  expect(parseOptions(['help', '--format=json']))
    .toMatchObject({ command: 'help', format: 'json' });
  expect(() => parseOptions(['help', 'trace-element'])).toThrow(/positional argument/);
  expect(parseOptions(['version'])).toMatchObject({ command: 'version' });
  expect(parseOptions(['trace-element', ' spaced '])).toMatchObject({ elementId: ' spaced ' });
  expect(parseOptions(['trace-element', '--', '-edge'])).toMatchObject({ elementId: '-edge' });
  for (const args of [[], [''], ['one', 'two']]) {
    expect(() => parseOptions(['trace-element', ...args])).toThrow(/element ID|positional argument/);
  }
});

it.each(['--property', '--nonsens', '--help', '--version'])('rejects unsupported trace option %s', option => {
  expect(() => parseOptions(['trace-element', 'root', option, 'value'])).toThrow(/Unknown option/);
});
