import { service, type ServiceNode, eventFlow, type EventFlow } from '@metamodel';
import { expectTypeOf, it } from 'vitest';
import { defineElement, Node, Edge, type ElementDefinition, type GraphElement } from '@core';

it('preserves argument tuples, domain parameters, readonly results, and predicate narrowing', () => {
  class Custom extends Node {
    public constructor(public id: string, public count = 1, ...labels: string[]) { super(); this.labels = labels; }
    public readonly labels: string[];
  }
  const custom = defineElement(Custom);
  expectTypeOf(custom).toEqualTypeOf<ElementDefinition<[id: string, count?: number, ...labels: string[]], Custom>>();
  const value = custom('id', 2, 'a', 'b');
  expectTypeOf(value).toEqualTypeOf<Readonly<Custom>>();
  custom('id');
  // @ts-expect-error required domain argument
  custom();
  // @ts-expect-error wrong domain argument type
  custom('id', 'count');
  // @ts-expect-error result properties are readonly
  value.id = 'changed';
  // @ts-expect-error definition guard cannot be replaced
  custom.is = () => true;
  // @ts-expect-error definitions are callable, not constructors
  new custom('id');
  // @ts-expect-error requires a ModelElement constructor
  defineElement(class Unrelated {});
  const values: unknown[] = [value, new Edge(undefined, undefined), null];
  expectTypeOf(values.filter(custom.is)).toEqualTypeOf<Custom[]>();
});

it('exports metamodel definitions and type-only classes with domain-specific signatures', () => {
  const from = service('orders', 'Orders');
  expectTypeOf(from).toEqualTypeOf<Readonly<ServiceNode>>();
  const elements: GraphElement[] = [from];
  expectTypeOf(elements.filter(service.is)).toEqualTypeOf<ServiceNode[]>();
  expectTypeOf<ReturnType<typeof eventFlow>>().toEqualTypeOf<Readonly<EventFlow>>();
  // @ts-expect-error implementation constructor is a type-only export
  new ServiceNode('id', 'name');
  // @ts-expect-error implementation constructor is a type-only export
  new EventFlow(from, from, 'publish');
  // @ts-expect-error domain eventFlow kind is required
  eventFlow(from, from);
  // @ts-expect-error invalid domain eventFlow kind
  eventFlow(from, from, 'unknown');
});
