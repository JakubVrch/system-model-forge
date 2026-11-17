import { expectTypeOf, it } from 'vitest';
import { findById, readonlySet, Node } from '@core';

it('preserves element types and requires an ID matching the collection', () => {
  const item: Readonly<{ id: string; name: string }> = { id: 'one', name: 'One' };
  const values = readonlySet([item]);
  expectTypeOf(findById(values, 'one')).toEqualTypeOf<typeof item | undefined>();
  expectTypeOf(findById(new Set([{ id: 1 }]), 1)).toEqualTypeOf<{ id: number } | undefined>();
  // @ts-expect-error lookup ID must match the declared ID type
  findById(values, 1);
  // @ts-expect-error elements must declare an ID; core Node does not impose one
  findById(new Set([new Node()]), 'one');
  // @ts-expect-error query accepts a set
  findById([item], 'one');
});
