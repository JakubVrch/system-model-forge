import { describe, expect, it } from 'vitest';

import { Edge } from '../../src/element/edge.js';
import { Node } from '../../src/element/node.js';
import { exportDiagram } from '../../src/export/export-diagram.js';

describe('exportDiagram', () => {
  it('exports an empty selection as the required frame', () => {
    expect(exportDiagram([])).toBe('diagram\nend\n');
  });

  it('renders selected nodes and edges using notation and preserves endpoint semantics', () => {
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

    const a = new ServiceNode();
    const b = new Node();
    const c = new Node();
    const selectedEdge = new ServiceEdge(a, b);
    const omittedEndpointEdge = new Edge(c, undefined);
    const selectedNode = new ServiceNode();

    const output = exportDiagram([selectedEdge, selectedNode, omittedEndpointEdge]);

    expect(output).toBe(
      'diagram\n' +
        '  edge: Node -> undefined: Edge\n' +
        '  edge: service api(server)[API] -> Node: api:R --> L:db\n' +
        '  node: service api(server)[API]\n' +
        'end\n',
    );
  });
});
