import { describe, expect, it } from 'vitest';
import { unionSet, readonlySet } from '@core';

describe('unionSet', () => {
  it('combines different value types and keeps each original object once', () => {
    const first = { label: 'orders' };
    const sameLabelDifferentObject = { label: 'orders' };
    const result = unionSet([first], readonlySet([first, sameLabelDifferentObject]), ['label', first]);
    expect(result.size).toBe(3);
    const values = [...result];
    expect(values[0]).toBe(first);
    expect(values[1]).toBe(sameLabelDifferentObject);
    expect(values[2]).toBe('label');
  });

  it('accepts values produced one at a time and keeps an independent protected copy', () => {
    const source = new Set([1, 2]);
    // A generator supplies its values one at a time and can be exhausted.
    function* later() {
      yield 2;
      yield 3;
    }
    const iterator = later();
    const result = unionSet(source, iterator);
    expect([...result]).toEqual([1, 2, 3]);
    expect(iterator.next().done).toBe(true);
    source.clear();
    expect([...result]).toEqual([1, 2, 3]);
    expect(() => (result as Set<number>).clear()).toThrow();
  });

  it('returns fresh empty sets when no values are supplied', () => {
    const empty = unionSet();
    expect(empty.size).toBe(0);
    expect(Object.isFrozen(empty)).toBe(true);
    expect(empty).not.toBe(unionSet());
    expect(unionSet([], new Set()).size).toBe(0);
  });
});
