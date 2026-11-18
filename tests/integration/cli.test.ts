import { expect, it } from 'vitest';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { runCli, temporaryDirectory } from './cli-helpers.ts';
it('offers complete source-free help and version in both formats', async () => {
 for (const command of [[], ['build'], ['list-elements'], ['partition-info']]) {
  const result = await runCli([...command, '--help', '--root=/does-not-exist', '--format=json']);
  expect(result.status).toBe(0); const doc = JSON.parse(result.stdout); expect(doc.command).toBe('help');
  for (const text of ['partition-info', 'list-elements', '--out', '--property', '--limit', '--tsconfig', 'trusted', 'overwrite', 'intersection']) expect(doc.data.help).toContain(text);
 }
 const version = await runCli(['--version', '--format=json']); expect(JSON.parse(version.stdout).data.version).toBe(JSON.parse(await readFile('package.json', 'utf8')).version);
 expect((await runCli(['--help'])).stdout).toContain('model-forge');
});
it.each([['unknown'], ['partition-info','--unknown'], ['list-elements','--limit=0'], ['partition-info','--partition-id='], ['build']])('emits one JSON failure for invalid arguments %j', async (...args) => {
 const result = await runCli([...args, '--format=json']); expect(result.status).toBe(1); const doc = JSON.parse(result.stdout); expect(doc.success).toBe(false); expect(doc.data).toBeNull(); expect(result.stdout.endsWith('\n')).toBe(true); expect(result.stdout).not.toContain('\x1b');
});
it('reports supported formats plainly', async () => {
 const result = await runCli(['partition-info','--format=xml']); expect(result.status).toBe(1); expect(result.stdout).toBe(''); expect(result.stderr).toContain('pretty, json'); expect(result.stderr).not.toContain('at main');
});
it('isolates source writes, handles malformed results and early exit without hangs', async () => {
 await using temp = await temporaryDirectory();
 const file = join(temp.path, 'a.partition.ts');
 for (const source of ['process.exit(0)', "process.send?.({kind:'list-elements',data:{selections:[{}]}})"]) {
  await writeFile(file, source); const result = await runCli(['list-elements','--root',temp.path,'--format=json']); expect(result.status).toBe(1); expect(JSON.parse(result.stdout).data).toBeNull();
 }
 const result = await runCli(['partition-info','--root','tests/integration/fixtures/cli/loading','--format=json']);
 expect(result.status).toBe(0); expect(JSON.parse(result.stdout).success).toBe(true); expect(result.stderr).toContain('direct source stdout');
});
it('selects exact IDs amid duplicate names and repeats all JSON results and artifacts identically', async () => {
 await using temp = await temporaryDirectory();
 for (const id of ['a','b']) {
  await mkdir(join(temp.path,id));
  await writeFile(join(temp.path,id,'model.partition.ts'), `export const partition = {id:'${id}',name:'Same',elements:{},diagrams:{chart:{data:new Set(),inNotation:'${id} exact',fileExtension:'.txt'}},metamodel:{}};`);
 }
 for (const command of ['partition-info','list-elements','build']) {
  const results = [];
  for (let i=0;i<3;i++) {
   const result = await runCli([command,'--root',temp.path,'--partition-id=a','--format=json',...(command === 'build' ? ['--out',join(temp.path,'out')] : [])]);
   expect(result.status).toBe(0); results.push(result.stdout);
  }
  expect(new Set(results).size).toBe(1);
 }
 expect(await readFile(join(temp.path,'out/a/chart.txt'),'utf8')).toBe('a exact');
}, 30000);
