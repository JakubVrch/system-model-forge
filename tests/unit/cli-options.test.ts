import { expect, it } from 'vitest';
import { resolve } from 'node:path';
import { parseOptions, requestedFormat } from '../../src/cli/options.ts';
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
