import { describe, expect, it } from 'vitest';
import { unionSet, readonlySet } from '@core';

describe('unionSet', () => {
  it('combines heterogeneous sources by identity in first-occurrence order', () => {
    const first = {}, sameLabelDifferentObject = {};
    const result = unionSet([first], readonlySet([first, sameLabelDifferentObject]), ['label', first]);
    expect(result.size).toBe(3);
    const values = [...result];
    expect(values[0]).toBe(first);
    expect(values[1]).toBe(sameLabelDifferentObject);
    expect(values[2]).toBe('label');
  });

  it('consumes iterables once and returns a protected snapshot independent of inputs', () => {
    const source = new Set([1, 2]);
    function* later() { yield 2; yield 3; }
    const iterator = later();
    const result = unionSet(source, iterator);
    expect([...result]).toEqual([1, 2, 3]);
    expect(iterator.next().done).toBe(true);
    source.clear();
    expect([...result]).toEqual([1, 2, 3]);
    expect(Object.isFrozen(result)).toBe(true);
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
