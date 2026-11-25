import { expectTypeOf, it } from 'vitest';
import { Edge, Node, defineElement, type Endpoint, type GraphElement } from '@core';

class Service extends Node { readonly serviceId = 'service'; }
class Database extends Node { readonly databaseId = 'database'; }
class Usage extends Edge<Service, Database> {
  constructor(from: Endpoint<Service>, to: Endpoint<Database>, id: string, name: string) {
    super(from, to, id, name);
  }
  override toNotation(): string {
    return `${this.from?.serviceId} ${this.name} ${this.to?.databaseId}`;
  }
}

it('preserves inferred and declared endpoint types, including missing endpoints', () => {
  const from = new Service('service', 'Node');
  const to = new Database('database', 'Node');
  const edge = new Edge(from, to, 'relationship', 'Relationship');
  expectTypeOf(edge.name).toEqualTypeOf<string>();
  // @ts-expect-error edge name is required
  new Edge(from, to, 'missing-name');
  expectTypeOf(edge.from).toEqualTypeOf<Endpoint<Service>>();
  expectTypeOf(edge.to).toEqualTypeOf<Endpoint<Database>>();
  expectTypeOf<Endpoint<Service>>().toEqualTypeOf<Service | undefined>();
  expectTypeOf<Edge['from']>().toEqualTypeOf<Node | undefined>();
  expectTypeOf(new Edge(undefined, undefined, 'relationship', 'Relationship').to).toEqualTypeOf<Node | undefined>();
  expectTypeOf(edge).toExtend<GraphElement>();
  const usage = defineElement(Usage);
  expectTypeOf(usage(undefined, undefined, 'usage', 'Uses').to).toEqualTypeOf<Database | undefined>();
  expectTypeOf(usage(from, to, 'usage', 'Uses').from).toEqualTypeOf<Service | undefined>();
  // @ts-expect-error wrong endpoint type
  usage(to, from, 'usage', 'Uses');
  // @ts-expect-error endpoints must be nodes
  new Edge('service', to, 'relationship', 'Relationship');
  // @ts-expect-error endpoints remain readonly
  edge.to = to;
});
