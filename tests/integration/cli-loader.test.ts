import { expect, it } from 'vitest';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { linkBuiltPackage, temporaryDirectory } from './cli-helpers.ts';
import { loadSources } from '@cli/source/source-process';
import { parseOptions } from '@cli/arguments/options';
import { discover } from '@cli/source/discover';
import { isBuildResponse } from '@cli/commands/build/response';
const childUrl = pathToFileURL(resolve('dist/cli/commands/build/run-source.js'));
async function load(root: string, extra: string[] = [], diagnostics: string[] = []) {
 const invocation = parseOptions(['build', '--root', root, '--out', join(root, 'out'), ...extra]);
 return loadSources({ invocation, entries: (await discover(root, invocation.paths, invocation.out)).entries }, childUrl, isBuildResponse, text => diagnostics.push(text));
}
it('loads a shared package graph, forwards stdout and shuts down lingering handles', async () => {
 const diagnostics: string[] = [];
 const root = resolve('tests/integration/fixtures/cli/loading');
 const response = await load(root, [], diagnostics);
 if (response.kind !== 'build') throw Error('Expected build');
 expect(response.plan.partitions.map(p => p.id)).toEqual(['a', 'b']);
 expect(response.kind).toBe('build');
 expect(diagnostics.join('')).toContain('direct source stdout');
});
it('uses explicit aliases and skips path-excluded broken sources but fails actual broken imports', async () => {
 await using temp = await temporaryDirectory();
 await writeFile(join(temp.path, 'package.json'), '{"type":"module"}');
 await linkBuiltPackage(temp.path);
 await writeFile(join(temp.path, 'model-name.ts'), "export const name = 'Aliased';");
 const config = join(temp.path, 'custom.json');
 await writeFile(config, JSON.stringify({ compilerOptions: { paths: { '@model/name': ['./model-name.ts'] } } }));
 await mkdir(join(temp.path, 'good'));
 await writeFile(join(temp.path, 'good/good.partition.ts'), "import { definePartition } from 'governed-model-core'; import { name } from '@model/name'; export const partition = definePartition({id:'good',name});");
 await writeFile(join(temp.path, 'bad.partition.ts'), "throw Error('broken-source');");
 expect((await load(temp.path, ['--tsconfig', config, '--path=good/**'])).kind).toBe('build');
 await expect(load(temp.path, ['--tsconfig', config])).rejects.toThrow(/bad.partition.ts.*broken-source/);
 await writeFile(join(temp.path, 'good/good.partition.ts'), "import '../bad.partition.ts';");
 await expect(load(temp.path, ['--path=good/**'])).rejects.toThrow(/good.partition.ts.*broken-source/);
});
it.each([
  ['process.exit(0)', /exited/],
  ['export const other = {};', /partition/],
  ['export const partition = {id: 1};', /partition/],
  ["process.send?.({kind:'build',plan:{partitions:'invalid'}});", /invalid/i],
  ["process.send?.({kind:'partition-info',data:{partitions:[]}});", /invalid/i],
])('rejects early exit or malformed source results: %s', async (source, error) => {
 await using temp = await temporaryDirectory();
 await writeFile(join(temp.path, 'entry.partition.ts'), source);
 await expect(load(temp.path)).rejects.toThrow(error);
});
it('discovers nearest tsconfig upward from the source root', async () => {
 await using temp = await temporaryDirectory();
 await linkBuiltPackage(temp.path);
 await mkdir(join(temp.path, 'nested'));
 await writeFile(join(temp.path, 'model-name.ts'), "export const name = 'Nested';");
 await writeFile(join(temp.path, 'tsconfig.json'), JSON.stringify({ compilerOptions: { paths: { '@model/name': ['./model-name.ts'] } } }));
 await writeFile(join(temp.path, 'package.json'), '{"type":"module"}');
 await writeFile(join(temp.path, 'nested/entry.partition.ts'), "import { definePartition } from 'governed-model-core'; import { name } from '@model/name'; export const partition = definePartition({id:'nested',name});");
 expect((await load(join(temp.path, 'nested'))).kind).toBe('build');
});
