import { readonlySet } from './readonly-set.ts';

type IterableValue<T> = T extends Iterable<infer Value> ? Value : never;

export function unionSet<Sources extends readonly Iterable<unknown>[]>(
  ...sources: Sources
): ReadonlySet<IterableValue<Sources[number]>>;
/** Combine sources by identity, preserving first-occurrence order. */
export function unionSet(...sources: readonly Iterable<unknown>[]): ReadonlySet<unknown> {
  function* values(): IterableIterator<unknown> {
    for (const source of sources) yield* source;
  }
  return readonlySet(values());
}
