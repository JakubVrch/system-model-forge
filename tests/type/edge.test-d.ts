import { expectTypeOf, it } from 'vitest';
import { Edge, Node, defineElement, type Endpoint, type GraphElement } from '@core';

class Service extends Node { readonly serviceId = 'service'; }
class Database extends Node { readonly databaseId = 'database'; }
class Usage extends Edge<Service, Database> {
  constructor(from: Endpoint<Service>, to: Endpoint<Database>, readonly label = 'uses') {
    super(from, to);
  }
  override toNotation(): string {
    return `${this.from?.serviceId} ${this.label} ${this.to?.databaseId}`;
  }
}

it('preserves inferred and declared endpoint types, including missing endpoints', () => {
  const from = new Service();
  const to = new Database();
  const edge = new Edge(from, to);
  expectTypeOf(edge.from).toEqualTypeOf<Endpoint<Service>>();
  expectTypeOf(edge.to).toEqualTypeOf<Endpoint<Database>>();
  expectTypeOf<Endpoint<Service>>().toEqualTypeOf<Service | undefined>();
  expectTypeOf<Edge['from']>().toEqualTypeOf<Node | undefined>();
  expectTypeOf(new Edge(undefined, undefined).to).toEqualTypeOf<Node | undefined>();
  expectTypeOf(edge).toExtend<GraphElement>();
  const usage = defineElement(Usage);
  expectTypeOf(usage(undefined, undefined).to).toEqualTypeOf<Database | undefined>();
  expectTypeOf(usage(from, to).from).toEqualTypeOf<Service | undefined>();
  // @ts-expect-error wrong endpoint type
  usage(to, from);
  // @ts-expect-error endpoints must be nodes
  new Edge('service', to);
  // @ts-expect-error endpoints remain readonly
  edge.to = to;
});
