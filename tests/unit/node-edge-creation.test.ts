import { describe, expect, it } from 'vitest';

import { Edge } from '../../src/element/edge.js';
import { Node } from '../../src/element/node.js';

describe('element creation', () => {
  it('creates default nodes and edges and supports subclassing', () => {
    const a = new Node();
    const b = new Node();

    expect(new Node().toNotation()).toBe('Node');
    expect(new Edge(a, b).toNotation()).toBe('Edge');

    const edge = new Edge(a, b);
    expect(edge.from).toBe(a);
    expect(edge.to).toBe(b);

    expect(() => new Edge(undefined, undefined)).not.toThrow();
    expect(() => new Edge(a, undefined)).not.toThrow();
    expect(() => new Edge(undefined, b)).not.toThrow();

    const undefinedEdge = new Edge(undefined, undefined);
    expect(undefinedEdge.from).toBeUndefined();
    expect(undefinedEdge.to).toBeUndefined();

    class ServiceNode extends Node {
      public extra(): string {
        return 'ok';
      }

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
    const serviceEdge = new ServiceEdge(serviceNode, a);

    expect(serviceNode instanceof Node).toBe(true);
    expect(serviceEdge instanceof Edge).toBe(true);
    expect(serviceNode.extra()).toBe('ok');
    expect(serviceNode.toNotation()).toBe('service api(server)[API]');
    expect(serviceEdge.toNotation()).toBe('api:R --> L:db');
    expect(serviceEdge.from).toBe(serviceNode);
    expect(serviceEdge.to).toBe(a);
  });
});
