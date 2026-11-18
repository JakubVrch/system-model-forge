import { expect, it } from 'vitest';
import { Node, Edge, definePartition } from '../../src/core/index.ts';
import { partitionInfo } from '../../src/cli/inspect.ts';
import { formatInventory } from '../../src/cli/format.ts';
it('inventories sorted full membership without evaluating business methods or exposing payloads', () => {
 const node = new Node('secret'); Object.defineProperty(node, 'getElementInfo', { value() { throw Error('must not evaluate'); } });
 const members = new Set([node, new Edge(node, undefined, 'edge')]);
 const parent = { entry: { path: 'parent.partition.ts', absolutePath: '/parent', parentPath: null }, partition: definePartition({ id: 'parent', name: 'Parent' }) };
 const child = { entry: { path: 'child/child.partition.ts', absolutePath: '/child', parentPath: parent.entry.path }, partition: definePartition({ id: 'child', name: 'Child', elements: { z: members, a: new Set<Node>() }, diagrams: { chart: { data: members, fileExtension: '.mmd', inNotation: 'SECRET TEXT' } } }) };
 const result = partitionInfo([child], [parent, child]);
 expect(result.partitions[0]).toMatchObject({ parent: { path: parent.entry.path, id: 'parent', name: 'Parent' }, exports: { elements: [{ key: 'a', nodes: 0, edges: 0 }, { key: 'z', nodes: 1, edges: 1 }], diagrams: [{ key: 'chart', nodes: 1, edges: 1, fileExtension: '.mmd' }], metamodel: [] } });
 expect(partitionInfo([child], [child]).partitions[0]?.parent).toEqual({ path: parent.entry.path });
 expect(JSON.stringify(result)).not.toContain('secret'); expect(formatInventory(result)).not.toContain('SECRET'); expect(formatInventory(result)).toContain('.mmd');
 expect(partitionInfo([parent], [parent]).partitions[0]?.exports).toEqual({ elements: [], diagrams: [], metamodel: [] });
});
