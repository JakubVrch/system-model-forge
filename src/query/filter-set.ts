import { readonlySet } from '../collection/readonly-set.ts';

export function filterSet<T, S extends T>(
  values: ReadonlySet<T>,
  predicate: (value: T) => value is S,
): ReadonlySet<S>;
export function filterSet<T>(values: ReadonlySet<T>, predicate: (value: T) => boolean): ReadonlySet<T>;
/** Filter in insertion order into a protected snapshot, preserving type guards. */
export function filterSet<T>(values: ReadonlySet<T>, predicate: (value: T) => boolean): ReadonlySet<T> {
  function* matches(): IterableIterator<T> {
    for (const value of values) {
      if (predicate(value)) yield value;
    }
  }
  return readonlySet(matches());
}
