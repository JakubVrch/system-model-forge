import { Edge } from '../element/edge.js';
import { Node } from '../element/node.js';

export type GraphElement = Node | Edge;

function formatEndpoint(node: Node | undefined): string {
  return node === undefined ? 'undefined' : node.toNotation();
}

export function exportDiagram(elements: readonly GraphElement[]): string {
  const lines = elements.map((element) => {
    if (element instanceof Node) {
      return `  node: ${element.toNotation()}`;
    }

    return `  edge: ${formatEndpoint(element.from)} -> ${formatEndpoint(element.to)}: ${element.toNotation()}`;
  });

  const sorted = [...lines].sort((left, right) => {
    if (left < right) return -1;
    if (left > right) return 1;
    return 0;
  });

  if (sorted.length === 0) {
    return 'diagram\nend\n';
  }

  return `diagram\n${sorted.join('\n')}\nend\n`;
}
