import { Edge, type GraphElement, type Node } from '@core';
import { CliError } from '@cli/errors';
import { ordinal } from '@cli/ordering';
import type { SelectedExport } from '@cli/source/model';
import type { TraceBranch, TraceElement, TraceResult } from '@cli/commands/trace-element/result';
import { describeElement, readData } from '@cli/source/graph-element';

function traceIdentity(element: GraphElement) {
  const { identity, modelType } = describeElement(element);
  return { ...identity, modelType };
}

type Connection = Omit<TraceBranch, 'element'> & { edge: Edge; node: Node };

function connections(element: GraphElement): Connection[] {
  const items: Connection[] = [];
  const add = (edge: Edge, node: Node | undefined, direction: TraceBranch['direction']) => {
    if (node !== undefined) items.push({ ...traceIdentity(edge), direction, edge, node });
  };

  if (element instanceof Edge) {
    add(element, element.to, 'To');
    add(element, element.from, 'From');
  } else {
    for (const edge of element.outgoing) add(edge, edge.to, 'To');
    for (const edge of element.incoming) add(edge, edge.from, 'From');
  }
  return items.sort((left, right) => ordinal(left.modelType ?? '', right.modelType ?? '')
    || Number(right.direction === 'To') - Number(left.direction === 'To'));
}

function expand(root: GraphElement, depth: number): TraceElement {
  const ancestors = new Set<GraphElement>([root]);
  const usedEdges = new Set<Edge>();

  function visit(element: GraphElement, remaining: number): TraceElement {
    const relationships: TraceBranch[] = [];
    if (remaining > 0) {
      for (const { edge, node, ...branch } of connections(element)) {
        if (usedEdges.has(edge)) continue;

        if (ancestors.has(node)) {
          relationships.push({ ...branch, element: { ...traceIdentity(node), relationships: [] } });
          continue;
        }

        ancestors.add(node);
        usedEdges.add(edge);
        relationships.push({ ...branch, element: visit(node, remaining - 1) });
        usedEdges.delete(edge);
        ancestors.delete(node);
      }
    }
    return { ...traceIdentity(element), relationships };
  }

  return visit(root, depth);
}

export function traceElements(selections: SelectedExport[], id: string, depth = 1): TraceResult {
  const matches = new Set<GraphElement>();
  for (const selection of selections) {
    for (const member of selection.members) {
      if (readData(member, 'id') === id) matches.add(member);
    }
  }
  if (matches.size === 0) {
    throw new CliError('No published element matches ID ' + JSON.stringify(id), { selector: id });
  }
  return { roots: Array.from(matches, element => expand(element, depth)) };
}
