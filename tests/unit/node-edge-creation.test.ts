import { describe, expect, it } from 'vitest';

import { Edge } from '@core/element/edge';
import { Node } from '@core/element/node';

describe('element creation', () => {
  it('creates nodes and edges with default notation', () => {
    const orders = new Node();
    const payments = new Node();

    expect(new Node().toNotation()).toBe('Node');
    expect(new Edge(orders, payments).toNotation()).toBe('Edge');

    const edge = new Edge(orders, payments);
    expect(edge.from).toBe(orders);
    expect(edge.to).toBe(payments);
  });

  it('allows missing endpoints', () => {
    const undefinedEdge = new Edge(undefined, undefined);
    expect(undefinedEdge.from).toBeUndefined();
    expect(undefinedEdge.to).toBeUndefined();
  });

  it('lets subclasses provide their own notation', () => {
    const orders = new Node();

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

    const serviceNode = new ServiceNode();
    const serviceEdge = new ServiceEdge(serviceNode, orders);

    expect(serviceNode instanceof Node).toBe(true);
    expect(serviceEdge instanceof Edge).toBe(true);
    expect(serviceNode.toNotation()).toBe('service api(server)[API]');
    expect(serviceEdge.toNotation()).toBe('api:R --> L:db');
    expect(serviceEdge.from).toBe(serviceNode);
    expect(serviceEdge.to).toBe(orders);
  });
});
