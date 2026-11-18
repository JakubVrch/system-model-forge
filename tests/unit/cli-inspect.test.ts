import { expect, it, vi } from 'vitest';
import { Node, Edge, definePartition, graphKind } from '../../src/core/index.ts';
import { inspectElements } from '../../src/cli/inspect.ts';
import { selectExports } from '../../src/cli/select.ts';
export function candidate(elements: Record<string, ReadonlySet<Node | Edge>>) {
 return { entry: { path: 'a.partition.ts', absolutePath: '/a.partition.ts', parentPath: null }, partition: definePartition({ id: 'p', name: 'P', elements, diagrams: { same: { data: new Set<Node>(), inNotation: '', fileExtension: '.txt' } } }) };
}
it('keeps export groups and empty memberships, validates each requested key', () => {
 const c = candidate({ same: new Set() });
 expect(selectExports([c], ['same'], ['same']).map(s => s.export.group)).toEqual(['elements', 'diagrams']);
 expect(() => selectExports([c], ['absent'], [])).toThrow(/absent.*same/);
});
it('caches business methods, preserves duplicate IDs, metadata, refs and full endpoint membership', () => {
 class Service extends Node { name = 'service'; type = 'business'; value = 0; }
 const a = new Service('same'), b = new Service('same'), outside = new Service('external');
 const spy = vi.spyOn(a, 'getElementInfo');
 const edge = new Edge(a, b, 'edge'), external = new Edge(outside, undefined, 'external-edge');
 const selections = selectExports([candidate({ a: new Set([a, b, edge, external]), b: new Set([a]) })], [], []);
 const result = inspectElements(selections, ['value'], 1);
 expect(spy).toHaveBeenCalledTimes(1);
 const first = result.selections[0]!;
 expect(first.nodes).toMatchObject({ total: 2, returned: 1, omitted: 1 });
 expect(first.nodes.items[0]).toMatchObject({ ref: 'e1', modelType: 'Service', identity: { id: 'same', name: 'service' }, attributes: { value: 0 } });
 expect(first.edges.items[0]?.endpoints?.to).toMatchObject({ identity: { id: 'same' }, inExport: true });
 expect(first.edges.items[0]?.endpoints?.to?.ref).not.toBe('e1');
 expect(result.selections[1]?.nodes.items[0]?.ref).toBe('e1');
 const all = inspectElements(selections, [], undefined);
 expect(all.selections[0]?.edges.items[1]?.endpoints).toMatchObject({ from: { inExport: false }, to: null });
});
it('validates projection against full membership before limits and normalizes undefined', () => {
 class Special extends Node { extra = undefined; }
 const selections = selectExports([candidate({ a: new Set([new Node('a'), new Special('b')]) })], [], []);
 expect(inspectElements(selections, ['extra'], 1).selections[0]?.nodes.items[0]?.attributes).toEqual({});
 expect(inspectElements(selections, [], undefined).selections[0]?.nodes.items[1]?.attributes).toEqual({ extra: null });
 expect(() => inspectElements(selections, ['missing'], 1)).toThrow(/missing/);
});
it.each([() => ({ bad: true }), () => ({ bad: Infinity }), () => ({ get bad() { throw Error('getter executed'); } }), () => { throw Error('business failed'); }, () => []])('rejects invalid business methods contextually', method => {
 const node = new Node('bad'); Object.defineProperty(node, 'getElementInfo', { value: method });
 expect(() => inspectElements(selectExports([candidate({ a: new Set([node]) })], [], []), [], undefined)).toThrow(/a.partition.ts.*bad/);
});
it('rejects missing identity and unknown graph protocol without invoking accessors', () => {
 for (const node of [Object.create(Node.prototype), Object.create(null, { [graphKind]: { value: { version: 2, kind: 'node' } } })]) {
  expect(() => inspectElements(selectExports([candidate({ a: new Set([node]) })], [], []), [], undefined)).toThrow();
 }
});
it('skips stored getters and rich fields, reads inherited constructor data and keeps base types unavailable', () => {
 class Parent extends Node { inherited = 'yes'; }
 class Child extends Parent { richer = { secret: true }; get dangerous() { throw Error('navigation evaluated'); } }
 const node = new Child('a'); Object.defineProperty(node, 'hidden', { value: 'hidden', enumerable: false });
 const result = inspectElements(selectExports([candidate({ all: new Set([node, new Node('base')]) })], [], []), [], undefined);
 expect(result.selections[0]?.nodes.items[0]?.attributes).toEqual({ inherited: 'yes' });
 expect(result.selections[0]?.nodes.items[1]?.modelType).toBeNull();
});
