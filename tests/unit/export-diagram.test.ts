import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { Edge } from '../../src/element/edge.js';
import { Node } from '../../src/element/node.js';
import { exportDiagram, saveDiagram } from '../../src/export/export-diagram.js';

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
        super();
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
      ) {
        super(from, to);
      }

      public override toNotation(): string {
        const from = this.from as ServiceNode | undefined;
        const to = this.to as ServiceNode | undefined;

        return `Rel(${from?.id}, ${to?.id}, "${this.name}")`;
      }
    }

    const systemA = new ServiceNode('SystemA', 'System A');
    const systemB = new ServiceNode('SystemB', 'System B');
    const relationship = new ServiceEdge(systemA, systemB, 'REST');

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

  it('writes the export to a destination and surfaces write failures', async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), 'diagram-export-'));
    const destination = path.join(tempDir, 'system-context.mmd');

    await saveDiagram('C4Context\nSystemA\n', destination);
    expect(await readFile(destination, 'utf8')).toBe('C4Context\nSystemA\n');
    await expect(saveDiagram('should fail', tempDir)).rejects.toThrow();

    await rm(tempDir, { recursive: true, force: true });
  });
});
