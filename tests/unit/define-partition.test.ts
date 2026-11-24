import { describe, expect, it } from 'vitest';
import { defineElement, definePartition, Node, Edge, readonlySet } from '@core';

class Item extends Node {
  metadata = { labels: ['original'] };
  constructor(public id: string) { super(id); }
}
const item = defineElement(Item);
const empty = { id: '', name: '', elements: {}, diagrams: {}, metamodel: {} };

describe('definePartition', () => {
  it('publishes explicit empty groups and empty sets', () => {
    const partition = definePartition(empty);
    expect(partition.id).toBe('');
    expect(partition.name).toBe('');
    for (const group of [partition.elements, partition.diagrams, partition.metamodel]) {
      expect(Object.keys(group)).toEqual([]);
      expect(Object.isFrozen(group)).toBe(true);
    }
    const withSet = definePartition({ ...empty, elements: { empty: readonlySet() } });
    expect(withSet.elements.empty.size).toBe(0);
    expect(Reflect.get(withSet.elements, 'missing')).toBeUndefined();
  });

  it('snapshots native and readonly sets, preserving overlapping identities and order', () => {
    const first = item('same');
    const second = item('same');
    const source = new Set([first, second, first]);
    const elements = { all: source, shared: readonlySet([first]) };
    const metamodel = { item };
    const partition = definePartition({ ...empty, id: ' ID ', name: ' Name\n', elements, metamodel });
    source.clear();
    elements.shared = readonlySet([second]);
    elements.all = new Set();
    delete (metamodel as Partial<typeof metamodel>).item;
    expect(partition.id).toBe(' ID ');
    expect(partition.name).toBe(' Name\n');
    expect([...partition.elements.all]).toEqual([first, second]);
    expect([...partition.elements.shared]).toEqual([first]);
    expect(partition.metamodel.item).toBe(item);
    expect(Reflect.get(partition.elements.all, 'add')).toBeUndefined();
    expect(() => Set.prototype.add.call(partition.elements.all, first)).toThrow(TypeError);
    for (const [target, key] of [
      [partition, 'id'], [partition.elements, 'all'], [partition.metamodel, 'item'],
      [first, 'id'], [item, 'is'],
    ] as const) {
      expect(Reflect.set(target, key, 'changed')).toBe(false);
      expect(Reflect.defineProperty(target, key, { value: 'changed' })).toBe(false);
    }
    expect(Reflect.deleteProperty(partition.elements, 'all')).toBe(false);
  });

  it('publishes only own enumerable string keys with no inherited lookup', () => {
    const value = item('value');
    const elements = Object.create({ inherited: readonlySet([value]) }) as Record<string, ReadonlySet<Item>>;
    for (const key of ['__proto__', 'constructor', 'toString', '', 'A', 'a']) {
      Object.defineProperty(elements, key, { value: readonlySet([value]), enumerable: true });
    }
    Object.defineProperty(elements, 'hidden', { value: readonlySet([value]) });
    Object.defineProperty(elements, Symbol('ignored'), { value: readonlySet([value]), enumerable: true });
    const partition = definePartition({ ...empty, elements });
    expect(Object.keys(partition.elements)).toEqual(['__proto__', 'constructor', 'toString', '', 'A', 'a']);
    expect(partition.elements.inherited).toBeUndefined();
    expect(partition.elements.hidden).toBeUndefined();
    expect(Object.getPrototypeOf(partition.elements)).toBeNull();
    expect(Reflect.ownKeys(partition.elements)).toHaveLength(6);
    expect(Reflect.get(partition.metamodel, 'toString')).toBeUndefined();
    expect(Reflect.get(partition.diagrams, 'constructor')).toBeUndefined();
  });

  it('retains callable identity, recognition, and shallow construction semantics', () => {
    const localDefinition = defineElement(Item);
    const partition = definePartition({ ...empty, metamodel: { localDefinition } });
    const value = partition.metamodel.localDefinition('fresh');
    expect(partition.metamodel.localDefinition).toBe(localDefinition);
    expect(partition.metamodel.localDefinition.is(value)).toBe(true);
    expect(Object.isFrozen(value)).toBe(true);
    expect(Object.isFrozen(value.metadata)).toBe(false);
    value.metadata.labels.push('before publication');
    definePartition({ ...empty, elements: { fresh: new Set([value]) } });
    value.metadata.labels.push('after publication');
    expect(value.metadata.labels).toEqual(['original', 'before publication', 'after publication']);
    expect(Object.isFrozen(localDefinition.is)).toBe(false);
    expect(Object.isFrozen(Item.prototype)).toBe(false);
  });
});

it('allows fresh graph composition without changing published state or prior snapshots', () => {
  const published = new Item('published');
  const before = published.edges;
  const partition = definePartition({ ...empty, elements: { nodes: new Set([published]) } });
  const other = new Item('other');
  const connection = new Edge(other, published, 'relationship');
  expect([...published.incoming]).toEqual([connection]);
  expect(before.size).toBe(0);
  expect([...partition.elements.nodes]).toEqual([published]);
  expect(published.id).toBe('published');
  expect(Object.isFrozen(published)).toBe(false);
  const dangling = new Edge(published, undefined, 'relationship');
  const edges = definePartition({ ...empty, elements: { edges: new Set([connection, dangling]) } });
  expect([...edges.elements.edges]).toEqual([connection, dangling]);
  expect(edges.elements.edges.size).toBe(2);
  expect(dangling.to).toBeUndefined();
  expect(Object.isFrozen(other)).toBe(false);
  expect(Object.isFrozen(connection)).toBe(false);
  expect(Object.isFrozen(other.metadata)).toBe(false);
  expect([...partition.elements.nodes]).toEqual([published]);
});

it('publishes independent diagram snapshots and exact authored text without completing selections', () => {
  const local = new Item('local');
  const foreign = new Item('foreign');
  definePartition({ ...empty, elements: { foreign: new Set([foreign]) } });
  const diagramOnly = new Item('diagram-only');
  const edge = new Edge(local, foreign, 'relationship');
  const source = new Set([diagramOnly, foreign]);
  const first = { data: source, fileExtension: '.mmd', inNotation: ' \n authored text\t\n' };
  const second = { data: readonlySet([edge]), fileExtension: '.mmd', inNotation: 'unrelated text' };
  const diagrams = { first, second, empty: { data: readonlySet<Node>(), fileExtension: '.mmd', inNotation: '' } };
  const partition = definePartition({ ...empty, elements: { local: new Set([local]) }, diagrams });
  source.clear();
  first.inNotation = 'changed';
  first.data = new Set();
  diagrams.second = { data: readonlySet(), fileExtension: '.mmd', inNotation: 'changed' };
  expect([...partition.diagrams.first.data]).toEqual([diagramOnly, foreign]);
  expect(partition.diagrams.first.inNotation).toBe(' \n authored text\t\n');
  expect([...partition.diagrams.second.data]).toEqual([edge]);
  expect(partition.diagrams.second.inNotation).toBe('unrelated text');
  expect(partition.diagrams.empty.data.size).toBe(0);
  expect(partition.diagrams.empty.inNotation).toBe('');
  expect(Reflect.get(partition.diagrams, 'missing')).toBeUndefined();
  expect(Reflect.get(partition.diagrams, 'toString')).toBeUndefined();
  expect([...partition.elements.local]).toEqual([local]);
  expect(Object.isFrozen(diagramOnly)).toBe(false);
  expect(Object.isFrozen(diagramOnly.metadata)).toBe(false);
  expect(Reflect.get(partition.diagrams.first.data, 'add')).toBeUndefined();
  expect(() => Set.prototype.clear.call(partition.diagrams.first.data)).toThrow(TypeError);
  for (const [target, key] of [
    [partition, 'diagrams'], [partition.diagrams, 'first'],
    [partition.diagrams.first, 'data'], [partition.diagrams.first, 'inNotation'],
  ] as const) {
    expect(Reflect.set(target, key, 'changed')).toBe(false);
    expect(Reflect.deleteProperty(target, key)).toBe(false);
    expect(Reflect.defineProperty(target, key, { value: 'changed' })).toBe(false);
  }
});

it('retains dangling diagram edges without cleanup', () => {
  const edge = new Edge(undefined, undefined, 'relationship');
  const partition = definePartition({ ...empty, diagrams: {
    dangling: { data: new Set([edge]), fileExtension: '.mmd', inNotation: 'supplied' },
  } });
  expect([...partition.diagrams.dangling.data]).toEqual([edge]);
  expect(partition.diagrams.dangling.inNotation).toBe('supplied');
});

it('passes authored model state and definition guards through without inspection or freezing', () => {
  class Metadata { value = 1; }
  class Authored extends Node {
    metadata = { nested: ['original'], map: new Map(), set: new Set(), date: new Date(),
      bytes: new Uint8Array(1), custom: new Metadata() };
  }
  const value = new Authored('authored');
  let reads = 0;
  Object.defineProperty(value, 'secret', { get() { reads++; return {}; } });
  const definition = defineElement(Authored);
  const guardState = new Map();
  Object.defineProperty(definition.is, 'metadata', { value: guardState });
  const child = definePartition({ ...empty, elements: { value: new Set([value]) },
    diagrams: { view: { data: new Set([value]), fileExtension: '.mmd', inNotation: 'authored' } }, metamodel: { definition } });
  const parent = definePartition({ ...empty, elements: child.elements, diagrams: child.diagrams, metamodel: child.metamodel });
  expect([...parent.elements.value][0]).toBe(value);
  expect([...parent.diagrams.view.data][0]).toBe(value);
  expect(parent.metamodel.definition).toBe(definition);
  expect(parent.metamodel.definition.is).toBe(definition.is);
  expect(reads).toBe(0);
  for (const state of [value, value.metadata, ...Object.values(value.metadata), definition.is, guardState]) {
    expect(Object.isFrozen(state)).toBe(false);
  }
  // Publication leaves enforcement of model-state immutability to the author.
  value.metadata.nested.push('still author-owned');
  expect(value.metadata.nested).toEqual(['original', 'still author-owned']);
});

it('normalizes omitted contribution groups into independent frozen empty mappings', () => {
  const value = item('local');
  const inputs = [
    { id: 'root', name: 'Root' },
    { id: 'vocabulary', name: 'Vocabulary', metamodel: { item } },
    { id: 'model', name: 'Model', elements: { local: new Set([value]) } },
    { id: 'view', name: 'View', diagrams: { overview: { data: new Set([value]), fileExtension: '.mmd', inNotation: 'text' } } },
  ];
  for (const input of inputs) {
    const partition = definePartition(input);
    for (const key of ['elements', 'diagrams', 'metamodel'] as const) {
      expect(Object.keys(partition[key])).toEqual(Object.keys(input[key] ?? {}));
      expect(Object.isFrozen(partition[key])).toBe(true);
      expect(Object.getPrototypeOf(partition[key])).toBeNull();
    }
  }
  expect(definePartition(inputs[0]!).elements).not.toBe(definePartition(inputs[0]!).elements);
});

it('copies the exact required extension into a frozen diagram without changing membership', () => {
  const value = new Node('extension-node');
  const source = { data: new Set([value]), inNotation: ' exact\n', fileExtension: '.diagram.txt' };
  const result = definePartition({ id: 'extension', name: 'Extension', diagrams: { view: source } });
  source.fileExtension = '.changed';
  expect(result.diagrams.view.fileExtension).toBe('.diagram.txt');
  expect(result.diagrams.view.inNotation).toBe(' exact\n');
  expect([...result.diagrams.view.data]).toEqual([value]);
  expect(Object.isFrozen(result.diagrams.view)).toBe(true);
});
