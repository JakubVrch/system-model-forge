import { expect, it } from 'vitest';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { runCli, temporaryDirectory } from './cli-helpers.ts';
const args = ['partition-info', '--root', 'tests/integration/fixtures/microservice-environment'];
it('inventories all six fixture partitions and preserves loaded parent identity under ID selection', async () => {
 const result = await runCli([...args, '--format=json']); expect(result.status).toBe(0);
 const partitions = JSON.parse(result.stdout).data.partitions;
 expect(partitions).toHaveLength(6);
 const service = partitions.find((p: any) => p.id === 'service-a');
 expect(service.exports.elements).toEqual([{ key: 'localModel', nodes: 3, edges: 6 }]);
 expect(service.exports.diagrams[0].fileExtension).toBe('.mmd');
 const pretty = await runCli(args);
 for (const p of partitions) { expect(pretty.stdout).toContain(p.id); for (const key of p.exports.metamodel) expect(pretty.stdout).toContain(key); }
 for (const selector of ['--partition-id=service-a', '--partition-name=Service A', '--path=services/service-a/**']) {
  const selected = JSON.parse((await runCli([...args, selector, '--format=json'])).stdout).data.partitions;
  expect(selected).toHaveLength(1); expect(selected[0].id).toBe('service-a');
  expect(selected[0].parent).toEqual(selector.startsWith('--path') ? { path: 'services/services.partition.ts' } : { path: 'services/services.partition.ts', id: 'services', name: 'Services' });
 }
});
it('supports empty discovery and path-only ancestry with an excluded broken parent', async () => {
 await using temp = await temporaryDirectory();
 expect(JSON.parse((await runCli(['partition-info', '--root', temp.path, '--format=json'])).stdout).data).toEqual({ partitions: [] });
 await writeFile(join(temp.path, 'parent.partition.ts'), "throw Error('broken parent');");
 await mkdir(join(temp.path, 'child'));
 await writeFile(join(temp.path, 'child/child.partition.ts'), "export const partition = {id:'child',name:'Child',elements:{},diagrams:{},metamodel:{}};");
 const result = await runCli(['partition-info', '--root', temp.path, '--path=child/**', '--format=json']);
 expect(result.status).toBe(0); expect(JSON.parse(result.stdout).data.partitions[0].parent).toEqual({ path: 'parent.partition.ts' });
});
