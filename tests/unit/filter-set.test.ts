import { describe, expect, it, vi } from 'vitest';
import { filterSet, readonlySet } from '@core';

describe('filterSet', () => {
  it('evaluates each value once in insertion order and retains original references', () => {
    const first = { label: 'same' };
    const second = { label: 'same' };
    const third = { label: 'other' };
    const source = readonlySet([first, second, third]);
    const predicate = vi.fn((value: typeof first) => value !== second);
    const result = filterSet(source, predicate);
    expect(predicate.mock.calls.map(([value]) => value)).toEqual([first, second, third]);
    expect(result.size).toBe(2);
    expect([...result][0]).toBe(first);
    expect([...result][1]).toBe(third);
    expect([...source][1]).toBe(second);
  });

  it('returns a protected copy that is independent of its input', () => {
    const source = new Set([1, 2]);
    const all = filterSet(source, () => true);
    expect(all).not.toBe(source);
    expect(all).not.toBe(filterSet(source, () => true));
    expect([...all]).toEqual([1, 2]);
    expect(() => (all as Set<number>).add(3)).toThrow();
    source.clear();
    expect([...all]).toEqual([1, 2]);
  });

  it('returns empty protected results when nothing matches', () => {
    const none = filterSet(new Set([1, 2]), () => false);

    expect(none.size).toBe(0);
    expect(Object.isFrozen(none)).toBe(true);
    expect(filterSet(new Set<number>(), () => true).size).toBe(0);
  });

  it('propagates the original predicate error and leaves the input unchanged', () => {
    const source = new Set([1, 2]);
    const error = new Error('predicate failed');
    let caught: unknown;
    try {
      filterSet(source, () => { throw error; });
    } catch (failure) {
      caught = failure;
    }

    expect(caught).toBe(error);
    expect([...source]).toEqual([1, 2]);
  });
});
