import { filterSet } from './filter-set.ts';
import { Node } from '../element/node.ts';
import type { GraphElement } from '../element/graph-element.ts';

/** Remove edges with missing endpoints without adding or reordering elements. */
export function cleanSelection(elements: ReadonlySet<GraphElement>): ReadonlySet<GraphElement> {
  return filterSet(elements, element => element instanceof Node || (
    element.from !== undefined && element.to !== undefined
    && elements.has(element.from) && elements.has(element.to)
  ));
}
