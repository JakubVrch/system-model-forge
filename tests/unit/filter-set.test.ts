import { describe, expect, it, vi } from 'vitest';
import { filterSet, readonlySet } from '@core';

describe('filterSet', () => {
  it('evaluates each value once in insertion order and retains original references', () => {
    const first = { label: 'same' }, second = { label: 'same' }, third = { label: 'other' };
    const source = readonlySet([first, second, third]);
    const predicate = vi.fn((value: typeof first) => value !== second);
    const result = filterSet(source, predicate);
    expect(predicate.mock.calls.map(([value]) => value)).toEqual([first, second, third]);
    expect(result.size).toBe(2);
    expect([...result][0]).toBe(first);
    expect([...result][1]).toBe(third);
    expect([...source][1]).toBe(second);
  });

  it('returns fresh protected snapshots for empty, matching, and nonmatching inputs', () => {
    const source = new Set([1, 2]);
    const all = filterSet(source, () => true);
    const none = filterSet(source, () => false);
    expect(all).not.toBe(source);
    expect(all).not.toBe(filterSet(source, () => true));
    expect([...all]).toEqual([1, 2]);
    expect(none.size).toBe(0);
    expect(filterSet(new Set<number>(), () => true).size).toBe(0);
    expect(Object.isFrozen(all)).toBe(true);
    expect(Object.isFrozen(none)).toBe(true);
    expect(() => (all as Set<number>).add(3)).toThrow();
    expect(() => (all as Set<number>).delete(1)).toThrow();
    expect(() => (all as Set<number>).clear()).toThrow();
    source.clear();
    expect([...all]).toEqual([1, 2]);
  });

  it('propagates the original predicate error and leaves the input unchanged', () => {
    const source = new Set([1, 2]);
    const error = new Error('predicate failed');
    let caught: unknown;
    try { filterSet(source, () => { throw error; }); } catch (failure) { caught = failure; }
    expect(caught).toBe(error);
    expect([...source]).toEqual([1, 2]);
  });
});
