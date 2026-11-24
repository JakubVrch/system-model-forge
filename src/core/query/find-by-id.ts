/**
 * Return the first element whose authored ID strictly equals the requested ID,
 * or undefined when absent. Searches in iteration order without copying the set.
 * Preserves object identity; does not enforce ID uniqueness or require a base class.
 */
export function findById<T extends { readonly id: unknown }>(
  values: ReadonlySet<T>,
  id: NoInfer<T['id']>,
): T | undefined {
  for (const value of values) {
    if (value.id === id) return value;
  }
  return undefined;
}
