import { expect, it } from 'vitest';
import { mkdir, readFile, readdir, stat, symlink, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { temporaryDirectory, runCli } from './cli-helpers.ts';
const root = resolve('tests/integration/fixtures/cli/build');
it('builds nested partitions with exact bytes, collisions, empty diagrams and summaries agreeing across formats', async () => {
 await using temp = await temporaryDirectory(); const out = join(temp.path, 'out');
 const result = await runCli(['build', '--root', root, '--out', out, '--format=json']);
 expect(result.status, result.stderr).toBe(0); const json = JSON.parse(result.stdout);
 expect(json).toMatchObject({ schemaVersion: 1, command: 'build', success: true, error: null, data: { exportedFiles: 5, dryRun: false } });
 expect(json.data.partitions.map((p: { id: string }) => p.id)).toEqual(['child', 'grandchild', 'empty', 'root']);
 const files = { 'overview.mmd': ' root exact\n', 'deployment.puml': '@startuml\n@enduml\n', 'child/view.diagram.txt': 'collision winner\n', 'child/grandchild/overview.mmd': '', 'child/grandchild/details.txt': 'Unicode Žluťoučký\n' };
 for (const [path, text] of Object.entries(files)) expect(await readFile(join(out, path), 'utf8')).toBe(text);
 const pretty = await runCli(['build', '--root', root, '--out', out]);
 expect(pretty.status).toBe(0); expect(pretty.stdout).toContain('Exported files: 5');
 for (const partition of json.data.partitions) { expect(pretty.stdout).toContain(partition.path); for (const key of partition.diagrams) expect(pretty.stdout).toContain(key); }
 const again = await runCli(['build', '--root', root, '--out', out, '--format=json']); expect(again.stdout).toBe(result.stdout);
});
it('dry-run lists the same planned artifacts without creating output and selectors do not include descendants', async () => {
 await using temp = await temporaryDirectory(); const out = join(temp.path, 'new');
 const dry = await runCli(['build', '--root', root, '--out', out, '--dry-run', '--format=json']);
 expect(dry.status, dry.stderr).toBe(0); expect(JSON.parse(dry.stdout).data).toMatchObject({ plannedFiles: 5, exportedFiles: 0 });
 await expect(stat(out)).rejects.toThrow();
 const filtered = await runCli(['build', '--root', root, '--out', out, '--partition-id=child', '--partition-name=Child', '--path=child/**', '--format=json']);
 expect(filtered.status, filtered.stderr).toBe(0); expect(JSON.parse(filtered.stdout).data.exportedFiles).toBe(1);
 await expect(stat(join(out, 'child/grandchild'))).rejects.toThrow();
});
it('validates a later invalid diagram before any writes, and reports deterministic partial I/O failure', async () => {
 await using temp = await temporaryDirectory(); const source = join(temp.path, 'source'), out = join(temp.path, 'out'); await mkdir(source);
 await writeFile(join(source, 'entry.partition.ts'), "export const partition = {id:'bad',name:'Bad',elements:{},metamodel:{},diagrams:{a:{data:new Set(),inNotation:'ok',fileExtension:'.txt'},z:{data:new Set(),inNotation:'bad',fileExtension:'.'}}};");
 const bad = await runCli(['build', '--root', source, '--out', out, '--format=json']);
 expect(bad.status).toBe(1); expect(JSON.parse(bad.stdout)).toMatchObject({ success: false, data: null, error: { context: { exportKey: 'z' } } }); await expect(stat(out)).rejects.toThrow();
 await mkdir(join(out, 'child/grandchild/details.txt'), { recursive: true });
 const partial = await runCli(['build', '--root', root, '--out', out, '--format=json']); const json = JSON.parse(partial.stdout);
 expect(partial.status).toBe(1); expect(json).toMatchObject({ success: false, data: { exportedFiles: 1, partitions: [{ id: 'child', diagrams: ['view', 'view.diagram'] }, { id: 'grandchild', diagrams: [] }] }, error: { context: { exportKey: 'details' } } });
});
it('emits one JSON failure for invalid options and one empty success without selectors', async () => {
 await using temp = await temporaryDirectory();
 const invalid = await runCli(['build', '--wat', '--format=json']); expect(invalid.status).toBe(1); expect(JSON.parse(invalid.stdout).data).toBeNull();
 const empty = await runCli(['build', '--root', temp.path, '--out', join(temp.path, 'out'), '--format=json']); expect(empty.status, empty.stderr).toBe(0); expect(JSON.parse(empty.stdout).data).toMatchObject({ partitions: [], exportedFiles: 0 });
});
it('keeps source stdout out of the single JSON document and exits despite authored timers', async () => {
 await using temp = await temporaryDirectory();
 const result = await runCli(['build', '--root', resolve('tests/integration/fixtures/cli/loading'), '--out', join(temp.path, 'out'), '--format=json']);
 expect(result.status, result.stderr).toBe(0);
 expect(JSON.parse(result.stdout)).toMatchObject({ success: true, data: { exportedFiles: 0 } });
 expect(result.stderr).toContain('direct source stdout');
});
it('normalizes Unicode and space paths and counts actual host case collisions in dry and real builds', async () => {
 await using temp = await temporaryDirectory();
 const source = join(temp.path, 'source space Ž'), out = join(temp.path, 'output space Ž');
 const folder = 'nested space Ž';
 await mkdir(join(source, folder), { recursive: true });
 await mkdir(out);
 // Probe the actual volume rather than assuming an OS implies case sensitivity.
 await writeFile(join(out, 'Probe.txt'), 'probe');
 const foldsCase = await stat(join(out, 'probe.txt')).then(() => true, () => false);
 await writeFile(join(source, folder, 'model.partition.ts'), "export const partition={id:'unicode',name:'Ž Space',elements:{},metamodel:{},diagrams:{View:{data:new Set(),inNotation:'first',fileExtension:'.txt'},view:{data:new Set(),inNotation:'last Ž\\n',fileExtension:'.txt'}}};");
 const args = ['build', '--root', source, '--out', out, '--path', `${folder}/*.partition.ts`, '--format=json'];
 const dry = await runCli([...args, '--dry-run']);
 expect(dry.status, dry.stderr).toBe(0);
 const plan = JSON.parse(dry.stdout).data;
 expect(plan.plannedFiles).toBe(foldsCase ? 1 : 2);
 expect(plan.artifacts.map((a: { path: string }) => a.path)).toEqual([`${folder}/View.txt`, `${folder}/view.txt`]);
 await expect(stat(join(out, folder))).rejects.toThrow();
 const built = await runCli(args);
 expect(built.status, built.stderr).toBe(0);
 expect(JSON.parse(built.stdout).data.exportedFiles).toBe(plan.plannedFiles);
 expect(await readFile(join(out, folder, 'view.txt'), 'utf8')).toBe('last Ž\n');
 expect(await readFile(join(out, folder, 'View.txt'), 'utf8')).toBe(foldsCase ? 'last Ž\n' : 'first');
});
it('rejects a linked destination directory before writing any artifacts', async () => {
 await using temp = await temporaryDirectory();
 const out = join(temp.path, 'out'), elsewhere = join(temp.path, 'elsewhere');
 await mkdir(out); await mkdir(elsewhere);
 await symlink(elsewhere, join(out, 'child'), 'junction');
 const result = await runCli(['build', '--root', root, '--out', out, '--format=json']);
 expect(result.status).toBe(1);
 expect(JSON.parse(result.stdout)).toMatchObject({ success: false, data: null });
 expect(result.stdout).toContain('symlink');
 expect(await readdir(elsewhere)).toEqual([]);
 expect(await readdir(out)).toEqual(['child']);
});
