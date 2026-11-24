import { expect, it } from 'vitest';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { linkBuiltPackage, temporaryDirectory, runCli } from './cli-helpers.ts';
const args = ['list-elements', '--root', 'tests/integration/fixtures/cli/inspection'];
it('inspects source classes, exact provenance, projection and independent limits', async () => {
 const result = await runCli([...args, '--elements', 'all', '--property', 'score', '--limit', '2', '--format=json']);
 expect(result.status).toBe(0);
 const selection = JSON.parse(result.stdout).data.selections[0];
 expect(selection.nodes).toMatchObject({ total: 5, returned: 2, omitted: 3 });
 expect(selection.edges).toMatchObject({ total: 3, returned: 2, omitted: 1 });
 expect(selection.nodes.items[0]).toMatchObject({ modelType: 'Service', identity: { id: 'duplicate', name: 'Service 0' }, attributes: { score: 0 } });
 expect(selection.nodes.items.map((item: { identity: unknown }) => item.identity)).toEqual([
  { id: 'duplicate', name: 'Service 0' }, { id: 'duplicate', name: 'Service 1' },
 ]);
 for (const item of [...selection.nodes.items, ...selection.edges.items]) expect(item).not.toHaveProperty('ref');
 expect(selection.edges.items[0].endpoints.to).not.toHaveProperty('ref');
 expect(selection.edges.items[0].endpoints.to.inExport).toBe(true);
 expect(selection.edges.items[1].endpoints.from).toMatchObject({ modelType: 'Service', identity: { name: 'Outside' }, inExport: false });
 const headings = ['ID', 'Type', 'Name', 'From', 'To'];
 const pretty = await runCli([...args, '--elements=all', '--limit=2', ...headings.map(key => `--property=${key}`)]);
 expect(pretty.status).toBe(0);
 expect(pretty.stdout).toMatch(/^Nodes  2 shown · 5 total · 3 omitted$/m);
 expect(pretty.stdout).toMatch(/^Edges  2 shown · 3 total · 1 omitted$/m);
 expect(pretty.stdout).toContain('external (Service, name="Outside") (external)');
 expect(pretty.stdout).not.toContain('hiddenByProjection');
 for (const key of headings) expect(pretty.stdout).toContain(`attribute:${key}`);
});
it('keeps diagram and element exports separate and reports unknown keys/properties', async () => {
 const result = JSON.parse((await runCli([...args, '--format=json'])).stdout);
 expect(result.data.selections[0].edges.items[0].attributes.ref).toBe('authored-ref');
 expect(result.data.selections[0].edges.items[2].endpoints).toEqual({ from: null, to: null });
 expect(result.data.selections.map((s: any) => [s.export.group, s.export.key])).toEqual([['elements','all'],['elements','edges'],['elements','empty'],['diagrams','all']]);
 for (const option of ['--elements=absent', '--property=absent']) {
  const failed = await runCli([...args, option, '--format=json']); expect(failed.status).toBe(1); expect(JSON.parse(failed.stdout).data).toBeNull();
 }
});

it('rejects malformed business values and missing IDs from authored sources without partial output', async () => {
 await using temp = await temporaryDirectory();
 await writeFile(join(temp.path, 'package.json'), '{"type":"module"}');
 await linkBuiltPackage(temp.path);
 for (const body of ["getElementInfo() { return { bad: true }; }", "constructor() { super(undefined); }", "getElementInfo() { throw Error('business failed'); }"]) {
  await writeFile(join(temp.path, 'model.partition.ts'), `import {Node,definePartition} from 'governed-model-core'; class Bad extends Node { ${body} } export const partition=definePartition({id:'bad',name:'Bad',elements:{all:new Set([new Bad('id')])}});`);
  const result = await runCli(['list-elements','--root',temp.path,'--format=json']);
  expect(result.status).toBe(1); const doc=JSON.parse(result.stdout); expect(doc.data).toBeNull(); expect(doc.error.context).toMatchObject({ path:'model.partition.ts',exportKey:'all' });
 }
});
