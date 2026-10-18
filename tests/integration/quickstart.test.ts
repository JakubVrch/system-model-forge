import { describe, expect, it } from 'vitest';

import { Edge } from '../../src/element/edge.js';
import { Node } from '../../src/element/node.js';
import { exportDiagram } from '../../src/export/export-diagram.js';

describe('quickstart', () => {
  it('covers specialization, traversal, selection, and deterministic export', () => {
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

    const api = new ServiceNode();
    const db = new ServiceNode();
    const cache = new ServiceNode();

    const read = new ServiceEdge(api, db);
    const write = new ServiceEdge(api, db);
    const cacheLoop = new ServiceEdge(cache, cache);
    const route = new ServiceEdge(db, cache);

    expect(api.outgoing).toEqual([read, write]);
    expect(api.incoming).toEqual([]);
    expect(db.incoming).toEqual([read, write]);
    expect(cache.edges).toEqual([cacheLoop, route]);

    const selection = [api, read, write, route, cacheLoop].filter((element) => element instanceof Node || element instanceof Edge);
    const expected = exportDiagram(selection);
    const repeated = Array.from({ length: 100 }, () => exportDiagram(selection));

    expect(repeated.every((value) => value === expected)).toBe(true);

    const beforeApiEdges = [...api.edges];
    const beforeApiOutgoing = [...api.outgoing];
    const beforeApiIncoming = [...api.incoming];

    const exported = exportDiagram(selection);

    expect(exported).toBe(expected);
    expect(api.edges).toEqual(beforeApiEdges);
    expect(api.outgoing).toEqual(beforeApiOutgoing);
    expect(api.incoming).toEqual(beforeApiIncoming);
  });
});
