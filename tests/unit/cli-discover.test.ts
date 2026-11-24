import { expect, it } from 'vitest';
import { mkdir, writeFile, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { temporaryDirectory } from '../integration/cli-helpers.ts';
import { discover, validatePattern } from '@cli/source/discover';
async function entry(root: string, path: string) { const target = join(root, path); await mkdir(join(target, '..'), { recursive: true }); await writeFile(target, ''); }
it('prunes supports, hidden folders, symlinks and canonical output; retains ancestor paths before filtering', async () => {
  await using temp = await temporaryDirectory();
  for (const name of ['root.partition.ts', 'child/x.partition.ts', '_support/x.partition.ts', '.hidden/x.partition.ts', 'node_modules/x.partition.ts', 'out/x.partition.ts']) await entry(temp.path, name);
  await symlink(join(temp.path, 'child'), join(temp.path, 'linked'), 'junction');
  const { entries: found } = await discover(temp.path, ['child/**'], join(temp.path, 'out', '..', 'out'));
  expect(found.map(x => [x.path, x.parentPath])).toEqual([['child/x.partition.ts', 'root.partition.ts']]);
  expect((await discover(join(temp.path, '_support'))).entries.map(x => x.path)).toEqual(['x.partition.ts']);
});
it('rejects candidate-folder ambiguity only after path filters, orders POSIX paths ordinally', async () => {
  await using temp = await temporaryDirectory();
  for (const name of ['b.partition.ts', 'a.partition.ts', 'Z/z.partition.ts']) await entry(temp.path, name);
  await expect(discover(temp.path)).rejects.toThrow(/ambig/i);
  expect((await discover(temp.path, ['a.partition.ts', 'Z/**'])).entries.map(x => x.path)).toEqual(['Z/z.partition.ts', 'a.partition.ts']);
  await expect(discover(temp.path, ['missing'])).rejects.toThrow(/match/);
});
it.each(['/absolute', '../x', 'x/../y', 'x\\y', '[ab]', '{a,b}', '@(a)', 'a/**b', 'C:/x', 'a//b'])('rejects unsupported glob %s', value => { expect(() => validatePattern(value)).toThrow(); });
it.each(['**/*.partition.ts', 'a/?*.partition.ts', '*.partition.ts'])('accepts bounded glob %s', value => { expect(() => validatePattern(value)).not.toThrow(); });
it('does not prune the explicitly requested source tree when output is its ancestor', async () => {
 await using temp = await temporaryDirectory();
 const root = join(temp.path, 'source'); await entry(root, 'entry.partition.ts');
 expect((await discover(root, [], temp.path)).entries.map(e => e.path)).toEqual(['entry.partition.ts']);
});
