import { describe, expect, it } from 'vitest';

import { Edge } from '@core/element/edge';
import { Node } from '@core/element/node';

describe('element creation', () => {
  it('creates nodes and edges with default notation', () => {
    const orders = new Node('node', 'Node');
    const payments = new Node('node', 'Node');

    expect(new Node('node', 'Node').toNotation()).toBe('Node');
    expect(new Edge(orders, payments, 'relationship', 'Relationship').toNotation()).toBe('Edge');

    const edge = new Edge(orders, payments, 'relationship', 'Relationship');
    expect(edge.from).toBe(orders);
    expect(edge.to).toBe(payments);
  });

  it('keeps authored names and checks an edge name before registration', () => {
    const from = new Node('from', 'Service');
    const to = new Node('to', 'Service');
    expect(() => Reflect.construct(Edge, [from, to, 'missing'])).toThrow(/name/);
    expect(from.outgoing.size).toBe(0);
    expect(to.incoming.size).toBe(0);
    expect(from.name).toBe('Service');
    expect(new Edge(from, to, 'relationship', 'Calls').name).toBe('Calls');
  });

  it('allows missing endpoints', () => {
    const undefinedEdge = new Edge(undefined, undefined, 'relationship', 'Relationship');
    expect(undefinedEdge.from).toBeUndefined();
    expect(undefinedEdge.to).toBeUndefined();
  });

  it('lets subclasses provide their own notation', () => {
    const orders = new Node('node', 'Node');

    class ServiceNode extends Node {
      public override toNotation(): string {
        return 'service api(server)[API]';
      }
    }

    class ServiceEdge extends Edge {
      public override toNotation(): string {
        return 'api:R --> L:db';
      }
    }

    const serviceNode = new ServiceNode('service', 'Node');
    const serviceEdge = new ServiceEdge(serviceNode, orders, 'relationship', 'Relationship');

    expect(serviceNode instanceof Node).toBe(true);
    expect(serviceEdge instanceof Edge).toBe(true);
    expect(serviceNode.toNotation()).toBe('service api(server)[API]');
    expect(serviceEdge.toNotation()).toBe('api:R --> L:db');
    expect(serviceEdge.from).toBe(serviceNode);
    expect(serviceEdge.to).toBe(orders);
  });
});
