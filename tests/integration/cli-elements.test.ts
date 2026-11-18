import { expect, it } from 'vitest';
import { writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { temporaryDirectory, runCli } from './cli-helpers.ts';
const args = ['list-elements', '--root', 'tests/integration/fixtures/cli/inspection'];
it('inspects source classes, exact provenance, projection and independent limits', async () => {
 const result = await runCli([...args, '--elements', 'all', '--property', 'score', '--limit', '2', '--format=json']);
 expect(result.status).toBe(0);
 const selection = JSON.parse(result.stdout).data.selections[0];
 expect(selection.nodes).toMatchObject({ total: 5, returned: 2, omitted: 3 });
 expect(selection.edges).toMatchObject({ total: 3, returned: 2, omitted: 1 });
 expect(selection.nodes.items[0]).toMatchObject({ modelType: 'Service', identity: { id: 'duplicate', name: 'Service 0' }, attributes: { score: 0 } });
 expect(selection.nodes.items[1].ref).not.toBe(selection.nodes.items[0].ref);
 expect(selection.edges.items[0].endpoints.to.inExport).toBe(true);
 expect(selection.edges.items[1].endpoints.from).toMatchObject({ modelType: 'Service', identity: { name: 'Outside' }, inExport: false });
 const pretty = await runCli([...args, '--elements=all', '--limit=2']);
 expect(pretty.stdout).toContain('omitted=3'); expect(pretty.stdout).toContain('Outside');
});
it('keeps diagram and element exports separate and reports unknown keys/properties', async () => {
 const result = JSON.parse((await runCli([...args, '--format=json'])).stdout);
 expect(result.data.selections.map((s: any) => [s.export.group, s.export.key])).toEqual([['elements','all'],['elements','edges'],['elements','empty'],['diagrams','all']]);
 for (const option of ['--elements=absent', '--property=absent']) {
  const failed = await runCli([...args, option, '--format=json']); expect(failed.status).toBe(1); expect(JSON.parse(failed.stdout).data).toBeNull();
 }
});

it('rejects malformed business values and missing IDs from authored sources without partial output', async () => {
 await using temp = await temporaryDirectory();
 await writeFile(join(temp.path, 'package.json'), '{"type":"module"}');
 const core = pathToFileURL(resolve('dist/core/index.js')).href;
 for (const body of ["getElementInfo() { return { bad: true }; }", "constructor() { super(undefined); }", "getElementInfo() { throw Error('business failed'); }"]) {
  await writeFile(join(temp.path, 'model.partition.ts'), `import {Node,definePartition} from '${core}'; class Bad extends Node { ${body} } export const partition=definePartition({id:'bad',name:'Bad',elements:{all:new Set([new Bad('id')])}});`);
  const result = await runCli(['list-elements','--root',temp.path,'--format=json']);
  expect(result.status).toBe(1); const doc=JSON.parse(result.stdout); expect(doc.data).toBeNull(); expect(doc.error.context).toMatchObject({ path:'model.partition.ts',exportKey:'all' });
 }
});
