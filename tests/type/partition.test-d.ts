import { expectTypeOf, it } from 'vitest';
import { definePartition, defineElement, Node, Edge, readonlySet, type Partition, type PartitionDiagram } from '@core';

class Item extends Node {
  constructor(public id: string, public count = 1) { super(); }
}
const item = defineElement(Item);
const link = defineElement(Edge);
const empty = { id: 'id', name: 'Name', elements: {}, diagrams: {}, metamodel: {} };

it('preserves keys, member subtypes, heterogeneous definitions, and readonly collections', () => {
  const partition = definePartition({ ...empty,
    elements: { items: new Set([item('one')]), links: readonlySet([link(undefined, undefined)]) },
    metamodel: { item, link },
  });
  expectTypeOf(partition.elements.items).toEqualTypeOf<ReadonlySet<Readonly<Item>>>();
  expectTypeOf(partition.metamodel.item).toEqualTypeOf<typeof item>();
  expectTypeOf(partition.metamodel.link).toEqualTypeOf<typeof link>();
  expectTypeOf(partition.metamodel.item('two', 2)).toEqualTypeOf<Readonly<Item>>();
  expectTypeOf([{} as unknown].filter(partition.metamodel.item.is)).toEqualTypeOf<Item[]>();
  const broad: Partition = partition;
  expectTypeOf(broad.id).toEqualTypeOf<string>();
  const diagram: PartitionDiagram = { data: readonlySet(), inNotation: '' };
  expectTypeOf(diagram.inNotation).toEqualTypeOf<string>();
  // @ts-expect-error exact keys
  partition.elements.missing;
  // @ts-expect-error immutable mapping
  partition.elements.items = readonlySet();
  // @ts-expect-error immutable shell
  partition.id = 'other';
  // @ts-expect-error native Set mutators removed
  partition.elements.items.add(item('three'));
  // @ts-expect-error no delete
  partition.elements.items.delete(item('three'));
  // @ts-expect-error no clear
  partition.elements.items.clear();
  // @ts-expect-error required domain parameter retained
  partition.metamodel.item();
  // @ts-expect-error domain parameter type retained
  partition.metamodel.item(1);
  // @ts-expect-error readonly metamodel
  partition.metamodel.item = item;
});

it('rejects incomplete and incompatible declarations', () => {
  // @ts-expect-error missing id
  definePartition({ name: '', elements: {}, diagrams: {}, metamodel: {} });
  // @ts-expect-error missing name
  definePartition({ id: '', elements: {}, diagrams: {}, metamodel: {} });
  // @ts-expect-error string id required
  definePartition({ ...empty, id: 1 });
  // @ts-expect-error string name required
  definePartition({ ...empty, name: null });
  // @ts-expect-error arrays are not sets
  definePartition({ ...empty, elements: { items: [item('one')] } });
  // @ts-expect-error set members must be graph elements
  definePartition({ ...empty, elements: { items: new Set(['one']) } });
  // @ts-expect-error metamodel members must be definitions
  definePartition({ ...empty, metamodel: { item: new Item('one') } });
  // @ts-expect-error ordinary functions lack definition guards
  definePartition({ ...empty, metamodel: { item: () => new Item('one') } });
});

it('preserves diagram keys and member types while removing mutable input APIs', () => {
  const partition = definePartition({ ...empty, diagrams: {
    items: { data: new Set([item('one')]), inNotation: 'text' },
    edges: { data: readonlySet([link(undefined, undefined)]), inNotation: '' },
  } });
  expectTypeOf(partition.diagrams.items).toEqualTypeOf<PartitionDiagram<Readonly<Item>>>();
  expectTypeOf(partition.diagrams.edges.data).toEqualTypeOf<ReadonlySet<Readonly<Edge>>>();
  // @ts-expect-error exact diagram keys
  partition.diagrams.missing;
  // @ts-expect-error immutable diagram mapping
  partition.diagrams.items = { data: readonlySet(), inNotation: '' };
  // @ts-expect-error immutable diagram data
  partition.diagrams.items.data = readonlySet();
  // @ts-expect-error immutable diagram text
  partition.diagrams.items.inNotation = 'changed';
  // @ts-expect-error native Set add removed
  partition.diagrams.items.data.add(item('two'));
  // @ts-expect-error native Set delete removed
  partition.diagrams.items.data.delete(item('two'));
  // @ts-expect-error native Set clear removed
  partition.diagrams.items.data.clear();
  // @ts-expect-error missing data
  definePartition({ ...empty, diagrams: { bad: { inNotation: '' } } });
  // @ts-expect-error missing text
  definePartition({ ...empty, diagrams: { bad: { data: readonlySet() } } });
  // @ts-expect-error arrays are not diagram sets
  definePartition({ ...empty, diagrams: { bad: { data: [], inNotation: '' } } });
  // @ts-expect-error text must be a string
  definePartition({ ...empty, diagrams: { bad: { data: readonlySet(), inNotation: 1 } } });
});

it('infers exact empty groups and supports independent contributions', () => {
  const identityOnly = definePartition({ id: 'root', name: 'Root' });
  expectTypeOf(identityOnly.elements).toEqualTypeOf<{}>();
  expectTypeOf(identityOnly.diagrams).toEqualTypeOf<{}>();
  expectTypeOf(identityOnly.metamodel).toEqualTypeOf<{}>();
  const vocabulary = definePartition({ id: 'vocabulary', name: 'Vocabulary', metamodel: { item } });
  expectTypeOf(vocabulary.metamodel.item).toEqualTypeOf<typeof item>();
  // @ts-expect-error omitted groups have no declared keys
  vocabulary.elements.items;
  const model = definePartition({ id: 'model', name: 'Model', elements: { items: new Set([item('one')]) } });
  expectTypeOf(model.elements.items).toEqualTypeOf<ReadonlySet<Readonly<Item>>>();
  const view = definePartition({ id: 'view', name: 'View', diagrams: { overview: { data: new Set([item('one')]), inNotation: '' } } });
  expectTypeOf(view.diagrams.overview.data).toEqualTypeOf<ReadonlySet<Readonly<Item>>>();
});
