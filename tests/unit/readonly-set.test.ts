import { describe, expect, it } from 'vitest';
import { readonlySet } from '@core';

describe('readonlySet', () => {
  it('copies unique references in insertion order and exposes native read operations', () => {
    const a = {}, b = {};
    const source = new Set([a, b]);
    const result = readonlySet(source);
    source.clear();
    expect([...result]).toEqual([a, b]);
    expect(result.size).toBe(2);
    expect(result.has(a)).toBe(true);
    expect([...result.keys()]).toEqual([a, b]);
    expect([...result.values()]).toEqual([a, b]);
    expect([...result.entries()]).toEqual([[a, a], [b, b]]);
    const seen: object[] = [];
    const context = {};
    result.forEach(function (this: object, value, key, set) {
      expect(this).toBe(context);
      expect(key).toBe(value);
      expect(set).toBe(result);
      seen.push(value);
    }, context);
    expect(seen[0]).toBe(a);
    expect(seen[1]).toBe(b);
    expect([...readonlySet([a, a, b])]).toEqual([a, b]);
    expect(readonlySet().size).toBe(0);
  });

  it('prevents mutation, including native Set methods and callback access', () => {
    const item = {};
    const result = readonlySet([item]);
    expect(Object.isFrozen(result)).toBe(true);
    for (const method of ['add', 'delete', 'clear'] as const) {
      expect(() => (result as Set<object>)[method](item)).toThrow();
      expect(() => Reflect.apply(Set.prototype[method], result, [item])).toThrow();
    }
    result.forEach((_value, _key, set) => {
      expect(() => (set as Set<object>).clear()).toThrow();
    });
    expect(Reflect.set(result, 'has', () => false)).toBe(false);
    expect(result.has(item)).toBe(true);
    expect(Object.isFrozen(item)).toBe(false);
  });
});
