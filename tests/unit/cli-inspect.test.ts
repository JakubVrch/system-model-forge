import { expect, it, vi } from 'vitest';
import { Node, Edge, definePartition } from '@core';
import { inspectElements } from '@cli/commands/list-elements/inspect';
import { selectExports } from '@cli/source/select';
export function candidate(elements: Record<string, ReadonlySet<Node | Edge>>) {
 return { entry: { path: 'a.partition.ts', absolutePath: '/a.partition.ts', parentPath: null }, partition: definePartition({ id: 'p', name: 'P', elements, diagrams: { same: { data: new Set<Node>(), inNotation: '', fileExtension: '.txt' } } }) };
}
it('keeps export groups and empty memberships, validates each requested key', () => {
 const c = candidate({ same: new Set() });
 expect(selectExports([c], ['same'], ['same']).map(s => s.export.group)).toEqual(['elements', 'diagrams']);
 expect(() => selectExports([c], ['absent'], [])).toThrow(/absent.*same/);
});
it('caches business methods by object and preserves authored identity and endpoint membership', () => {
  class Service extends Node {
    constructor(id: string, name: string) { super(id, name); }
    type = 'business';
    ref = 'authored-ref';
    value = 0;
  }
  const a = new Service('same', 'first');
  const b = new Service('same', 'second');
  const outside = new Service('same', 'outside');
  const spies = [a, b, outside].map(node => vi.spyOn(node, 'getElementInfo'));
  const edge = new Edge(a, b, 'edge', 'Relationship');
  const external = new Edge(outside, undefined, 'external-edge', 'Relationship');
  const selections = selectExports([candidate({
    a: new Set([a, b, edge, external]), b: new Set([a, external]),
  })], [], []);

  const result = inspectElements(selections, ['value'], 1);
  for (const spy of spies) expect(spy).toHaveBeenCalledTimes(1);
  const first = result.selections[0]!;
  expect(first.nodes).toMatchObject({ total: 2, returned: 1, omitted: 1 });
  expect(first.nodes.items[0]).toEqual({
    kind: 'node', modelType: 'Service', identity: { id: 'same', name: 'first' }, attributes: { value: 0 },
  });
  expect(first.edges.items[0]).not.toHaveProperty('ref');
  expect(first.edges.items[0]?.endpoints?.to).toEqual({
    modelType: 'Service', identity: { id: 'same', name: 'second' }, inExport: true,
  });
  expect(result.selections[1]?.nodes.items[0]).toEqual(first.nodes.items[0]);
  expect(result.selections[1]?.edges.items[0]?.endpoints).toEqual({
    from: { modelType: 'Service', identity: { id: 'same', name: 'outside' }, inExport: false },
    to: null,
  });

  const all = inspectElements(selections, []).selections[0]!;
  expect(all.nodes.items.map(item => item.identity)).toEqual([
    { id: 'same', name: 'first' }, { id: 'same', name: 'second' },
  ]);
  expect(all.nodes.items[1]?.attributes.ref).toBe('authored-ref');
  expect(all.edges.items[1]?.endpoints).toMatchObject({ from: { inExport: false }, to: null });
});
it('validates projection against full membership before limits and normalizes undefined', () => {
 class Special extends Node { extra = undefined; }
 const selections = selectExports([candidate({ a: new Set([new Node('a', 'Node'), new Special('b', 'Node')]) })], [], []);
 expect(inspectElements(selections, ['extra'], 1).selections[0]?.nodes.items[0]?.attributes).toEqual({});
 expect(inspectElements(selections, [], undefined).selections[0]?.nodes.items[1]?.attributes).toEqual({ extra: null });
 expect(() => inspectElements(selections, ['missing'], 1)).toThrow(/missing/);
});
it.each([() => ({ bad: true }), () => ({ bad: Infinity }), () => ({ get bad() { throw Error('getter executed'); } }), () => { throw Error('business failed'); }, () => []])('rejects invalid business methods contextually', method => {
 const node = new Node('bad', 'Node'); Object.defineProperty(node, 'getElementInfo', { value: method });
 expect(() => inspectElements(selectExports([candidate({ a: new Set([node]) })], [], []), [], undefined)).toThrow(/a.partition.ts.*bad/);
});
it('rejects missing identity and plain objects with endpoint fields without invoking accessors', () => {
 for (const node of [Object.create(Node.prototype), { id: 'fake', from: undefined, to: undefined }]) {
  expect(() => inspectElements(selectExports([candidate({ a: new Set([node]) })], [], []), [], undefined)).toThrow();
 }
});
it('skips stored getters and rich fields, reads inherited constructor data and keeps base types unavailable', () => {
 class Parent extends Node { inherited = 'yes'; }
 class Child extends Parent { richer = { secret: true }; get dangerous() { throw Error('navigation evaluated'); } }
 const node = new Child('a', 'Node'); Object.defineProperty(node, 'hidden', { value: 'hidden', enumerable: false });
 const result = inspectElements(selectExports([candidate({ all: new Set([node, new Node('base', 'Node')]) })], [], []), [], undefined);
 expect(result.selections[0]?.nodes.items[0]?.attributes).toEqual({ inherited: 'yes' });
 expect(result.selections[0]?.nodes.items[1]?.modelType).toBeNull();
});

it('keeps core identity out of projection and treats custom label as a business attribute', () => {
  class Custom extends Node {
    override getElementInfo() { return { id: 'shadow-id', name: 'Shadow', label: 'Business label' }; }
  }
  const node = new Custom('service', 'Service');
  const selections = selectExports([candidate({ all: new Set([node]) })], [], []);
  const listed = (properties: string[]) => inspectElements(selections, properties).selections[0]?.nodes.items[0];

  expect(listed([])).toMatchObject({
    identity: { id: 'service', name: 'Service' },
    attributes: { label: 'Business label' },
  });
  expect(listed(['label'])).toEqual(listed([]));
  expect(listed(['label'])?.identity).toEqual({ id: 'service', name: 'Service' });
  expect(listed(['label'])?.attributes).toEqual({ label: 'Business label' });
  for (const key of ['id', 'name']) {
    expect(() => listed([key])).toThrow('Unknown property ' + JSON.stringify(key));
  }
});
