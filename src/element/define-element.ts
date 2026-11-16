import type { ModelElement } from './model-element.ts';

export type ElementDefinition<Args extends unknown[], T extends ModelElement> = {
  (...args: Args): Readonly<T>;
  readonly is: (value: unknown) => value is T;
};

/** Expose typed construction, shallow instance freezing, and class recognition. */
export function defineElement<Args extends unknown[], T extends ModelElement>(
  constructor: new (...args: Args) => T,
): ElementDefinition<Args, T> {
  return Object.freeze(Object.assign(
    (...args: Args): Readonly<T> => Object.freeze(new constructor(...args)),
    { is: (value: unknown): value is T => value instanceof constructor },
  ));
}
