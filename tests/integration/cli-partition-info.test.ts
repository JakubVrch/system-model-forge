import { expect, it } from 'vitest';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { InventoryResult } from '@cli/result';
import { runCli, temporaryDirectory } from './cli-helpers.ts';
const args = ['partition-info', '--root', 'tests/integration/fixtures/microservice-environment'];
it('inventories all six fixture partitions in JSON and pretty output', async () => {
  const result = await runCli([...args, '--format=json']);
  expect(result.status).toBe(0);
  const partitions = JSON.parse(result.stdout).data.partitions as InventoryResult['partitions'];
  expect(partitions).toHaveLength(6);
  const service = partitions.find(partition => partition.id === 'service-a');
  expect(service?.exports.elements).toEqual([{ key: 'localModel', nodes: 3, edges: 6 }]);
  expect(service?.exports.diagrams[0]?.fileExtension).toBe('.mmd');

  const pretty = await runCli(args);
  expect(pretty.status).toBe(0);
  for (const partition of partitions) {
    expect(pretty.stdout).toContain(partition.id);
    for (const key of partition.exports.metamodel) expect(pretty.stdout).toContain(key);
  }
});

it.each([
  ['--partition-id=service-a', { path: 'services/services.partition.ts', id: 'services', name: 'Services' }],
  ['--partition-name=Service A', { path: 'services/services.partition.ts', id: 'services', name: 'Services' }],
  ['--path=services/service-a/**', { path: 'services/services.partition.ts' }],
] as const)('reports the expected parent metadata with %s', async (selector, parent) => {
  const result = await runCli([...args, selector, '--format=json']);
  expect(result.status).toBe(0);
  const selected = JSON.parse(result.stdout).data.partitions;
  expect(selected).toHaveLength(1);
  expect(selected[0].id).toBe('service-a');
  expect(selected[0].parent).toEqual(parent);
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

it('reports the entry path once and preserves the invalid diagram key', async () => {
  await using temp = await temporaryDirectory();
  const path = 'demo.partition.ts';
  await writeFile(join(temp.path, path), `export const partition = {
    id: 'demo', name: 'Demo', elements: {}, metamodel: {},
    diagrams: { overview: { data: new Set(), inNotation: '' } },
  };`);

  const result = await runCli(['partition-info', '--root', temp.path, '--format=json']);
  expect(result.status).toBe(1);
  expect(JSON.parse(result.stdout).error).toEqual({
    message: `${path}: export "overview": diagram requires data, inNotation and fileExtension`,
    context: { path, exportKey: 'overview' },
  });
});
