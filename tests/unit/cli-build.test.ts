import { expect, it } from 'vitest';
import { mkdir, readFile, writeFile, symlink, stat, utimes, link } from 'node:fs/promises';
import { join } from 'node:path';
import { definePartition } from '@core';
import { buildPlan } from '../../src/cli/child.ts';
import { executeBuild } from '../../src/cli/build.ts';
import { CliError, type BuildPlan } from '../../src/cli/result.ts';
import { temporaryDirectory } from '../integration/cli-helpers.ts';
function plan(diagrams: Record<string, { fileExtension: string; inNotation: string }>, source = 'root.partition.ts'): BuildPlan {
 return buildPlan([{ entry: { path: source, absolutePath: `/source/${source}`, parentPath: null }, partition: definePartition({ id: 'root', name: 'Root', diagrams: Object.fromEntries(Object.entries(diagrams).map(([key, value]) => [key, { data: new Set(), ...value }])) }) }]);
}
const diagrams = { a: { fileExtension: '.diagram.txt', inNotation: '' }, 'a.diagram': { fileExtension: '.txt', inNotation: 'last\n' }, z: { fileExtension: '.puml', inNotation: '@startuml\n@enduml' } };
it('plans exact text and ordinal collisions with multipart extensions', () => {
 const result = plan(diagrams);
 expect(result.partitions[0]?.artifacts.map(a => [a.diagramKey, a.path, a.text])).toEqual([['a', 'a.diagram.txt', ''], ['a.diagram', 'a.diagram.txt', 'last\n'], ['z', 'z.puml', '@startuml\n@enduml']]);
});
it.each(['', '.', '..', 'mmd', '.a/b', '.a\\b', '.\u0000', '.\n', '..txt', '.txt.'])('rejects invalid extensions %j', fileExtension => { expect(() => plan({ a: { fileExtension, inNotation: '' } })).toThrow(); });
it.each(['', '.', '..', '../escape', 'a/b', 'a\\b', 'x\u0000', 'CON', 'a:', 'a?', 'a*', 'a\n'])('rejects invalid keys/final filenames %j', key => { expect(() => plan({ [key]: { fileExtension: '.txt', inNotation: '' } })).toThrow(); });
it('dry-run creates nothing and reports distinct planned files including empty partitions', async () => {
 await using temp = await temporaryDirectory();
 const out = join(temp.path, 'output'); const source = join(temp.path, 'source'); await mkdir(source);
 const build = plan(diagrams); build.partitions.push({ id: 'empty', name: 'Empty', path: 'z/empty.partition.ts', artifacts: [] });
 const summary = await executeBuild(build, source, out, true);
 expect(summary).toMatchObject({ exportedFiles: 0, plannedFiles: 2, dryRun: true, partitions: [{ diagrams: ['a', 'a.diagram', 'z'] }, { diagrams: [] }] });
 await expect(stat(out)).rejects.toThrow();
});
it('overwrites unconditionally, preserves stale files, counts distinct writes, and writes exact empty bytes', async () => {
 await using temp = await temporaryDirectory(); const source = join(temp.path, 'source'), out = join(temp.path, 'out'); await mkdir(source); await mkdir(out);
 await writeFile(join(out, 'a.diagram.txt'), 'last\n'); await utimes(join(out, 'a.diagram.txt'), 1, 1); await writeFile(join(out, 'stale'), 'keep');
 const result = await executeBuild(plan(diagrams), source, out, false);
 expect(result.exportedFiles).toBe(2); expect(result.partitions[0]?.diagrams).toEqual(['a', 'a.diagram', 'z']);
 expect(await readFile(join(out, 'a.diagram.txt'), 'utf8')).toBe('last\n'); expect((await stat(join(out, 'a.diagram.txt'))).mtimeMs).toBeGreaterThan(1000);
 expect(await readFile(join(out, 'stale'), 'utf8')).toBe('keep');
 await executeBuild(plan({ empty: { fileExtension: '.txt', inNotation: '' } }), source, out, false);
 expect((await readFile(join(out, 'empty.txt'))).byteLength).toBe(0);
});
it('preflights every destination before writing, rejects source root equality, source overwrite, escapes and symlinks', async () => {
 await using temp = await temporaryDirectory(); const root = join(temp.path, 'root'), out = join(temp.path, 'out'); await mkdir(root); await mkdir(out);
 await expect(executeBuild(plan(diagrams), root, root, false)).rejects.toThrow(/source root/);
 await mkdir(join(root, 'nested')); await writeFile(join(root, 'nested/root.partition.ts'), 'source');
 await expect(executeBuild(plan({ root: { fileExtension: '.partition.ts', inNotation: '' } }), root, join(root, 'nested'), false)).rejects.toThrow(/source/);
 await symlink(root, join(out, 'z.puml'), 'junction');
 await expect(executeBuild(plan(diagrams), root, out, false)).rejects.toThrow(/symlink/);
 await expect(stat(join(out, 'a.diagram.txt'))).rejects.toThrow();
 const escaped = plan({ safe: { fileExtension: '.txt', inNotation: '' } }); escaped.partitions[0]!.artifacts[0]!.path = '../escape.txt';
 await expect(executeBuild(escaped, root, out, false)).rejects.toThrow(/escape|relative|path/i);
});
it('stops on first write failure and retains only completed diagram keys and distinct successes', async () => {
 await using temp = await temporaryDirectory(); const root = join(temp.path, 'root'), out = join(temp.path, 'out'); await mkdir(root); await mkdir(join(out, 'z.puml'), { recursive: true });
 try { await executeBuild(plan(diagrams), root, out, false); expect.fail('must fail'); } catch (error) {
  expect(error).toBeInstanceOf(CliError);
  expect((error as CliError).partial).toMatchObject({ exportedFiles: 1, partitions: [{ diagrams: ['a', 'a.diagram'] }] });
  expect((error as CliError).context.exportKey).toBe('z');
 }
 expect(await readFile(join(out, 'a.diagram.txt'), 'utf8')).toBe('last\n');
});
it('counts host filesystem aliases once', async () => {
 await using temp = await temporaryDirectory(); const source = join(temp.path, 'source'), out = join(temp.path, 'out'); await mkdir(source); await mkdir(out);
 await writeFile(join(out, 'a.txt'), 'old'); await link(join(out, 'a.txt'), join(out, 'b.txt'));
 const result = await executeBuild(plan({ a: { fileExtension: '.txt', inNotation: 'first' }, b: { fileExtension: '.txt', inNotation: 'last' } }), source, out, false);
 expect(result.exportedFiles).toBe(1); expect(await readFile(join(out, 'a.txt'), 'utf8')).toBe('last');
});
it('rejects terminal controls and oversized final filenames before writes', () => {
 expect(() => plan({ a: { fileExtension: '.\u009b', inNotation: '' } })).toThrow();
 expect(() => plan({ ['x'.repeat(256)]: { fileExtension: '.txt', inNotation: '' } })).toThrow();
});
it('rejects symlink directory components before creating any artifact', async () => {
 await using temp = await temporaryDirectory(); const root = join(temp.path, 'root'), out = join(temp.path, 'out'); await mkdir(root); await mkdir(out);
 await symlink(root, join(out, 'nested'), 'junction');
 await expect(executeBuild(plan({ a: { fileExtension: '.txt', inNotation: 'no' } }, 'nested/entry.partition.ts'), root, out, false)).rejects.toThrow(/symlink/);
 await expect(stat(join(root, 'a.txt'))).rejects.toThrow();
});
