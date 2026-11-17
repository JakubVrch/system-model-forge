import { expect, it } from 'vitest';
import { findById, readonlySet } from '@core';

it('returns the first matching object by identity without changing the set', () => {
  const first = { id: 'shared', name: 'First' };
  const second = { id: 'shared', name: 'Second' };
  const values = readonlySet([first, second]);
  expect(findById(values, 'shared')).toBe(first);
  expect([...values]).toEqual([first, second]);
});

it('returns undefined for missing IDs and empty sets', () => {
  expect(findById(new Set([{ id: 'known' }]), 'missing')).toBeUndefined();
  expect(findById(new Set<{ id: string }>(), 'missing')).toBeUndefined();
});

it('compares IDs without coercion', () => {
  const numeric = { id: 1 };
  const textual = { id: '1' };
  const values = new Set<{ id: string | number }>([numeric, textual]);
  expect(findById(values, 1)).toBe(numeric);
  expect(findById(values, '1')).toBe(textual);
});
