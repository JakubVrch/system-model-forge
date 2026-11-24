export type ElementInfo = Readonly<Record<string, string | number | null | undefined>>;

export abstract class ModelElement {
  abstract readonly id: string;
  protected constructor() {}
  abstract toNotation(): string;

  /** Snapshot supported own data; never evaluate accessors or traverse graph state. */
  public getElementInfo(): ElementInfo {
    return snapshotElementInfo(this);
  }
}

export function snapshotElementInfo(element: ModelElement, excluded: readonly string[] = []): ElementInfo {
  const result: Record<string, string | number | null | undefined> = Object.create(null);
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(element))) {
    if (!descriptor.enumerable || !('value' in descriptor) ||
        ['id', 'edges', 'outgoing', 'incoming'].includes(key) || excluded.includes(key)) continue;
    const value: unknown = descriptor.value;
    if (value === null || value === undefined || typeof value === 'string' ||
        (typeof value === 'number' && Number.isFinite(value))) result[key] = value;
  }
  return Object.freeze(result);
}
