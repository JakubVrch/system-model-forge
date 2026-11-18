import { expectTypeOf, it } from 'vitest';
import { partition, type ServiceNode } from '../integration/fixtures/microservice-environment/services/services.partition.ts';
const { service } = partition.metamodel;
import { filterSet, readonlySet, Node, Edge, type GraphElement } from '@core';

it('narrows set elements using generated metamodel guards', () => {
  const elements = readonlySet<GraphElement>([service('api', 'API'), new Edge(undefined, undefined, 'relationship')]);
  const services = filterSet(elements, service.is);
  expectTypeOf(services).toEqualTypeOf<ReadonlySet<ServiceNode>>();
  expectTypeOf(filterSet(elements, element => element.toNotation() !== '')).toEqualTypeOf<ReadonlySet<GraphElement>>();
  expectTypeOf(filterSet(elements, (element): element is Node => element instanceof Node)).toEqualTypeOf<ReadonlySet<Node>>();
  // @ts-expect-error result has no mutation methods
  services.clear();
  // @ts-expect-error inputs must be sets
  filterSet([...elements], service.is);
  // @ts-expect-error predicates must accept the input element type
  filterSet(elements, (value: number) => value > 0);
});
