import { describe, expect, it } from 'vitest';

import { readonlySet } from '@core';

describe('readonlySet', () => {
  it('copies original objects once in insertion order', () => {
    const first = {};
    const second = {};
    const source = [first, first, second];

    const result = readonlySet(source);
    source.length = 0;

    expect(result.size).toBe(2);
    expect([...result][0]).toBe(first);
    expect([...result][1]).toBe(second);
    expect(Object.isFrozen(first)).toBe(false);
  });

  it('supports normal Set read operations', () => {
    const result = readonlySet(['orders', 'payments']);

    expect(result.has('orders')).toBe(true);
    expect(result.has('missing')).toBe(false);
    expect([...result]).toEqual(['orders', 'payments']);
    expect([...result.keys()]).toEqual(['orders', 'payments']);
    expect([...result.values()]).toEqual(['orders', 'payments']);
    expect([...result.entries()]).toEqual([['orders', 'orders'], ['payments', 'payments']]);
  });

  it('passes the protected set and requested context to forEach', () => {
    const result = readonlySet(['orders', 'payments']);
    const seen: string[] = [];
    const context = {};

    result.forEach(function (this: object, value, key, set) {
      expect(this).toBe(context);
      expect(key).toBe(value);
      expect(set).toBe(result);
      expect(() => (set as Set<string>).clear()).toThrow();
      seen.push(value);
    }, context);

    expect(seen).toEqual(['orders', 'payments']);
  });

  it('blocks mutation methods and replacement of its properties', () => {
    const result = readonlySet(['orders']);

    // Casts intentionally bypass TypeScript to check runtime protection.
    expect(() => (result as Set<string>).add('payments')).toThrow();
    expect(() => (result as Set<string>).delete('orders')).toThrow();
    expect(() => (result as Set<string>).clear()).toThrow();
    expect(Object.isFrozen(result)).toBe(true);
    expect(Reflect.set(result, 'has', () => false)).toBe(false);
    expect(result.has('orders')).toBe(true);
  });

  it('also blocks clearing through a borrowed native Set method', () => {
    const result = readonlySet(['orders']);

    expect(() => Set.prototype.clear.call(result)).toThrow();
  });

  it('creates an empty set when no values are supplied', () => {
    expect(readonlySet().size).toBe(0);
  });
});
