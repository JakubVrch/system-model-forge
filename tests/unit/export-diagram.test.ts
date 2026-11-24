import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { Edge } from '@core/element/edge';
import { Node } from '@core/element/node';
import { exportDiagram, saveDiagram } from '@core/export/export-diagram';

describe('exportDiagram', () => {
  it('exports an empty selection as the required frame', () => {
    expect(exportDiagram([], 'diagram', 'end')).toBe('diagram\nend\n');
    expect(exportDiagram([], 'C4Context\ntitle System Context diagram', '')).toBe(
      'C4Context\ntitle System Context diagram\n',
    );
  });

  it('renders nodes before edges and preserves supplied boundaries', () => {
    class ServiceNode extends Node {
      public constructor(
        public readonly id: string,
        public readonly name: string,
      ) {
        super(id);
      }

      public override toNotation(): string {
        return `System(${this.id}, "${this.name}")`;
      }
    }

    class ServiceEdge extends Edge {
      public constructor(
        from: Node,
        to: Node,
        public readonly name: string,
        id: string,
      ) {
        super(from, to, id);
      }

      public override toNotation(): string {
        const from = this.from as ServiceNode | undefined;
        const to = this.to as ServiceNode | undefined;

        return `Rel(${from?.id}, ${to?.id}, "${this.name}")`;
      }
    }

    const systemA = new ServiceNode('SystemA', 'System A');
    const systemB = new ServiceNode('SystemB', 'System B');
    const relationship = new ServiceEdge(systemA, systemB, 'REST', 'relationship');

    const output = exportDiagram(
      [relationship, systemA, systemB],
      'C4Context\ntitle System Context diagram',
      '',
    );

    expect(output).toBe(
      'C4Context\n' +
        'title System Context diagram\n' +
        'System(SystemA, "System A")\n' +
        'System(SystemB, "System B")\n' +
        'Rel(SystemA, SystemB, "REST")\n',
    );
  });

  it('accepts sets and single-use iterables with nodes-first ordering', () => {
    const orders = new Node('node');
    const payments = new Node('node');
    const edge = new Edge(orders, payments, 'relationship');
    function* elements() {
      yield edge;
      yield orders;
      yield payments;
    }
    const expected = 'diagram\nNode\nNode\nEdge\nend\n';
    expect(exportDiagram(elements())).toBe(expected);
    expect(exportDiagram(new Set([edge, orders, payments]))).toBe(expected);
  });

  it('exports the supplied edges without automatically adding or cleaning endpoints', () => {
    const edge = new Edge(new Node('node'), new Node('node'), 'relationship');

    expect(exportDiagram([edge])).toBe('diagram\nEdge\nend\n');
  });

  it('reports a write failure when the destination is a directory', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'diagram-export-'));

    try {
      await expect(saveDiagram('diagram text', directory)).rejects.toThrow();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
