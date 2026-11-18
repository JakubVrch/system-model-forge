import { graphKind } from './graph-element.ts';

export type ElementInfo = Readonly<Record<string, string | number | null | undefined>>;

export abstract class ModelElement {
  abstract readonly id: string;
  protected constructor() {}
  abstract toNotation(): string;

  /** Snapshot supported own data; never evaluate accessors or traverse graph state. */
  public getElementInfo(): ElementInfo {
    const result: Record<string, string | number | null | undefined> = Object.create(null);
    let prototype: object | null = this;
    let edge = false;
    while (prototype) {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, graphKind);
      if (descriptor) { edge = descriptor.value?.kind === 'edge'; break; }
      prototype = Object.getPrototypeOf(prototype) as object | null;
    }
    for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(this))) {
      if (!descriptor.enumerable || !('value' in descriptor) ||
          ['id', 'edges', 'outgoing', 'incoming'].includes(key) || (edge && (key === 'from' || key === 'to'))) continue;
      const value: unknown = descriptor.value;
      if (value === null || value === undefined || typeof value === 'string' ||
          (typeof value === 'number' && Number.isFinite(value))) result[key] = value;
    }
    return Object.freeze(result);
  }
}
