import { expectTypeOf, it } from 'vitest';
import { partition } from '../integration/fixtures/microservice-environment/services/services.partition.ts';
const { service } = partition.metamodel;
import { unionSet, readonlySet, Node, Edge } from '@core';

it('infers the union of heterogeneous source element types without explicit arguments', () => {
  const node = new Node('node', 'Node'), edge = new Edge(node, undefined, 'relationship', 'Relationship');
  const result = unionSet([node], readonlySet([edge]), new Set(['text']));
  expectTypeOf(result).toEqualTypeOf<ReadonlySet<Node | Edge | string>>();
  const instance = service('api', 'API');
  expectTypeOf(unionSet([instance], [edge])).toEqualTypeOf<ReadonlySet<typeof instance | Edge>>();
  expectTypeOf(unionSet()).toEqualTypeOf<ReadonlySet<never>>();
  // @ts-expect-error sources must be iterable
  unionSet(node);
  // @ts-expect-error result is readonly
  result.add(node);
});
