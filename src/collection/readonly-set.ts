/** An insertion-ordered snapshot that exposes no mutable backing set. */
class SetSnapshot<T> implements ReadonlySet<T> {
  readonly #items: Set<T>;

  public constructor(values: Iterable<T>) {
    this.#items = new Set(values);
    Object.freeze(this);
  }

  public get size(): number { return this.#items.size; }
  public has(value: T): boolean { return this.#items.has(value); }
  public entries(): SetIterator<[T, T]> { return this.#items.entries(); }
  public keys(): SetIterator<T> { return this.#items.keys(); }
  public values(): SetIterator<T> { return this.#items.values(); }
  public [Symbol.iterator](): SetIterator<T> { return this.#items[Symbol.iterator](); }

  public forEach(callback: (value: T, key: T, set: ReadonlySet<T>) => void, thisArg?: unknown): void {
    for (const value of this.#items) callback.call(thisArg, value, value, this);
  }
}

export function readonlySet<T>(values: Iterable<T> = []): ReadonlySet<T> {
  return new SetSnapshot(values);
}
