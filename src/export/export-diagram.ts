import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import type { GraphElement } from '../element/graph-element.ts';
import { Node } from '../element/node.ts';

export type { GraphElement } from '../element/graph-element.ts';

function formatEndpoint(node: Node | undefined): string {
  return node === undefined ? 'undefined' : node.toNotation();
}

export function exportDiagram(
  elements: Iterable<GraphElement>,
  startText = 'diagram',
  endText = 'end',
): string {
  const nodeLines: string[] = [];
  const edgeLines: string[] = [];

  for (const element of elements) {
    if (element instanceof Node) {
      nodeLines.push(element.toNotation());
      continue;
    }

    edgeLines.push(element.toNotation());
  }

  const body = [...nodeLines, ...edgeLines].join('\n');
  const sections = [startText, body, endText].filter((section) => section !== '');

  return `${sections.join('\n')}\n`;
}

export async function saveDiagram(diagram: string, destination: string): Promise<void> {
  const directory = dirname(destination);

  if (directory !== '.') {
    await mkdir(directory, { recursive: true });
  }

  await writeFile(destination, diagram, 'utf8');
}
