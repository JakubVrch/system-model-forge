import { readonlySet } from '../collection/readonly-set.ts';
import type { Edge } from '../element/edge.ts';
import type { Node } from '../element/node.ts';

/** Follow one filtered hop. Predicates must not mutate the graph. */
export function connectedNodes(
  nodes: ReadonlySet<Node>,
  predicate: (edge: Edge) => boolean,
  direction: 'outgoing' | 'incoming' | 'both',
): ReadonlySet<Node> {
  const reached = new Set<Node>();
  for (const node of nodes) {
    const edges = direction === 'both' ? node.edges : node[direction];
    for (const edge of edges) {
      if (!predicate(edge)) continue;
      const opposite = edge.from === node ? edge.to : edge.from;
      if (opposite !== undefined) reached.add(opposite);
    }
  }
  return readonlySet(reached);
}
