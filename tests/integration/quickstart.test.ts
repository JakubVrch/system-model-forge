import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { Edge } from '../../src/element/edge.js';
import { Node } from '../../src/element/node.js';
import { exportDiagram, saveDiagram, type GraphElement } from '../../src/index.js';

function exportContext(title: string, elements: readonly GraphElement[]): string {
  return exportDiagram(elements, `C4Context\ntitle ${title}`, '');
}

describe('quickstart', () => {
  it('covers specialization, traversal, selection, and deterministic export to file', async () => {
    class ServiceNode extends Node {
      public constructor(
        public readonly id: string,
        public readonly name: string,
      ) {
        super();
      }

      public override toNotation(): string {
        return `System(${this.id}, "${this.name}")`;
      }
    }

    class Relationship extends Edge {
      public constructor(
        from: Node,
        to: Node,
        public readonly name: string,
      ) {
        super(from, to);
      }

      public override toNotation(): string {
        const from = this.from as ServiceNode | undefined;
        const to = this.to as ServiceNode | undefined;

        return `Rel(${from?.id}, ${to?.id}, "${this.name}")`;
      }
    }

    const api = new ServiceNode('SystemA', 'System A');
    const db = new ServiceNode('SystemB', 'System B');
    const cache = new ServiceNode('SystemC', 'System C');

    const read = new Relationship(api, db, 'REST');
    const write = new Relationship(api, db, 'WRITE');
    const cacheLoop = new Relationship(cache, cache, 'CACHE');
    const route = new Relationship(db, cache, 'ROUTE');

    expect(api.outgoing).toEqual([read, write]);
    expect(api.incoming).toEqual([]);
    expect(db.incoming).toEqual([read, write]);
    expect(cache.edges).toEqual([cacheLoop, route]);

    const selection = [api, read, write, route, cacheLoop].filter(
      (element) => element instanceof Node || element instanceof Edge,
    );

    const title = 'System Context diagram';
    const expected = exportContext(title, selection);
    const repeated = Array.from({ length: 100 }, () => exportContext(title, selection));

    expect(repeated.every((value) => value === expected)).toBe(true);

    const beforeApiEdges = [...api.edges];
    const beforeApiOutgoing = [...api.outgoing];
    const beforeApiIncoming = [...api.incoming];

    const exported = exportContext(title, selection);

    expect(exported).toBe(expected);
    expect(api.edges).toEqual(beforeApiEdges);
    expect(api.outgoing).toEqual(beforeApiOutgoing);
    expect(api.incoming).toEqual(beforeApiIncoming);

    const tempDir = await mkdtemp(path.join(tmpdir(), 'diagram-export-'));
    const destination = path.join(tempDir, 'system-context.mmd');

    await saveDiagram(exported, destination);
    expect(await readFile(destination, 'utf8')).toBe(exported);

    await rm(tempDir, { recursive: true, force: true });
  });
});
