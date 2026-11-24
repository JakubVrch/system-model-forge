import { describe, expect, it } from 'vitest';

import { Edge } from '@core/element/edge';
import { Node } from '@core/element/node';

describe('element creation', () => {
  it('creates nodes and edges with default notation', () => {
    const orders = new Node('node');
    const payments = new Node('node');

    expect(new Node('node').toNotation()).toBe('Node');
    expect(new Edge(orders, payments, 'relationship').toNotation()).toBe('Edge');

    const edge = new Edge(orders, payments, 'relationship');
    expect(edge.from).toBe(orders);
    expect(edge.to).toBe(payments);
  });

  it('allows missing endpoints', () => {
    const undefinedEdge = new Edge(undefined, undefined, 'relationship');
    expect(undefinedEdge.from).toBeUndefined();
    expect(undefinedEdge.to).toBeUndefined();
  });

  it('lets subclasses provide their own notation', () => {
    const orders = new Node('node');

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

    const serviceNode = new ServiceNode('service');
    const serviceEdge = new ServiceEdge(serviceNode, orders, 'relationship');

    expect(serviceNode instanceof Node).toBe(true);
    expect(serviceEdge instanceof Edge).toBe(true);
    expect(serviceNode.toNotation()).toBe('service api(server)[API]');
    expect(serviceEdge.toNotation()).toBe('api:R --> L:db');
    expect(serviceEdge.from).toBe(serviceNode);
    expect(serviceEdge.to).toBe(orders);
  });
});
