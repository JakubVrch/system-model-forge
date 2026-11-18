import { expectTypeOf, it } from 'vitest';
import { Node, Edge, defineElement } from '@core';
it('requires explicit readonly IDs and preserves inferred factory arguments', () => {
  // @ts-expect-error ID is mandatory
  new Node();
  // @ts-expect-error edge ID is mandatory
  new Edge(undefined, undefined);
  const node = defineElement(Node)('id');
  // @ts-expect-error identity is readonly
  node.id = 'changed';
  expectTypeOf(node.getElementInfo()).toEqualTypeOf<Readonly<Record<string, string | number | null | undefined>>>();
  expectTypeOf(defineElement(Edge)(node, undefined, 'edge').id).toEqualTypeOf<string>();
});
