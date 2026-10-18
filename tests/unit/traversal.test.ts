import { describe, expect, it } from 'vitest';

import { Edge } from '../../src/element/edge.js';
import { Node } from '../../src/element/node.js';

class ServiceEdge extends Edge {
  public override toNotation(): string {
    return 'service-edge';
  }
}

describe('traversal', () => {
  it('exposes incident edges and preserves immutable snapshots', () => {
    const isolated = new Node();
    expect(isolated.edges).toEqual([]);
    expect(isolated.outgoing).toEqual([]);
    expect(isolated.incoming).toEqual([]);

    const a = new Node();
    const b = new Node();
    const c = new Node();

    const first = new Edge(a, b);
    const self = new Edge(a, a);
    const second = new Edge(b, a);
    const missing = new Edge(a, undefined);
    const parallelOne = new Edge(a, b);
    const parallelTwo = new Edge(a, b);

    const before = a.edges;
    const beforeOutgoing = a.outgoing;
    const beforeIncoming = a.incoming;

    expect(a.edges).toEqual([first, self, second, missing, parallelOne, parallelTwo]);
    expect(a.outgoing).toEqual([first, self, missing, parallelOne, parallelTwo]);
    expect(a.incoming).toEqual([second, self]);

    expect(a.edges.filter((edge) => edge instanceof ServiceEdge)).toEqual([]);
    expect(Object.isFrozen(a.edges)).toBe(true);
    expect(Object.isFrozen(a.outgoing)).toBe(true);
    expect(Object.isFrozen(a.incoming)).toBe(true);

    const later = new Edge(a, c);
    expect(before).toEqual([first, self, second, missing, parallelOne, parallelTwo]);
    expect(beforeOutgoing).toEqual([first, self, missing, parallelOne, parallelTwo]);
    expect(beforeIncoming).toEqual([second, self]);
    expect(a.edges).toEqual([first, self, second, missing, parallelOne, parallelTwo, later]);

    const cycleOne = new Edge(b, c);
    const cycleTwo = new Edge(c, a);
    const cycleThree = new Edge(a, b);

    expect(b.edges).toEqual(expect.arrayContaining([first, cycleOne, cycleThree]));
    expect(c.edges).toEqual(expect.arrayContaining([later, cycleOne, cycleTwo]));
    expect(c.outgoing).toEqual([cycleTwo]);
    expect(c.incoming).toEqual(expect.arrayContaining([later, cycleOne]));
    expect(c.incoming).toHaveLength(2);
    expect(c.outgoing[0]).toBe(cycleTwo);

    const edgeWithUndefined = new Edge(undefined, b);
    expect(edgeWithUndefined.from).toBeUndefined();
    expect(edgeWithUndefined.to).toBe(b);
    expect(b.incoming).toContain(edgeWithUndefined);
    expect(isolated.edges).toEqual([]);

    const service = new ServiceEdge(a, b);
    expect(a.edges.filter((edge) => edge instanceof ServiceEdge)).toEqual([service]);
  });
});
