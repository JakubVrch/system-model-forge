import { readonlySet } from '../collection/readonly-set.ts';
import type { ElementDefinition } from '../element/define-element.ts';
import type { GraphElement } from '../element/graph-element.ts';
import type { ModelElement } from '../element/model-element.ts';

/** An authored view: its selected elements and already-rendered diagram text. */
export interface PartitionDiagram<T extends GraphElement = GraphElement> {
  readonly data: ReadonlySet<T>;
  readonly inNotation: string;
  readonly fileExtension: string;
}

type ElementExports = Record<string, ReadonlySet<GraphElement>>;
type DiagramExports = Record<string, PartitionDiagram>;
// A constraint only: inference retains each definition's actual argument tuple.
type MetamodelExports = Record<string, ElementDefinition<never[], ModelElement>>;
type PublishedElements<E extends ElementExports> = {
  readonly [K in keyof E as K & string]: ReadonlySet<E[K] extends ReadonlySet<infer T> ? T : never>;
};
type PublishedDiagrams<D extends DiagramExports> = {
  readonly [K in keyof D as K & string]: PartitionDiagram<D[K]['data'] extends ReadonlySet<infer T extends GraphElement> ? T : never>;
};

/**
 * A discoverable declaration of what this partition itself maintains and offers
 * for others to use. Its [name].partition.ts entry lets authors and future tooling
 * locate those contributions for exploration, model builds, and publication.
 *
 * Export only vocabulary, element selections, and diagrams maintained by this
 * partition. Do not republish contributions merely because they are imported or
 * belong to a child partition. A locally maintained selection or diagram may
 * reference elements maintained elsewhere. This is an authoring responsibility;
 * the core API does not enforce ownership.
 *
 * Hierarchy comes solely from folders: each partition has a [name].partition.ts
 * entry, and its parent is the nearest ancestor folder with a partition entry.
 * Supporting folders use an _ prefix and are excluded from hierarchy discovery;
 * files use ordinary names. No separate children registry is needed.
 *
 * Dependencies use ordinary TypeScript imports. Metamodel definitions may be owned
 * above, below, or across the hierarchy; using a definition need not republish it.
 * Cross-partition imports use partition entries for vocabulary and element sets.
 * Retrieve individual elements from those sets by domain ID; internal files remain
 * an authoring detail. Imports within a partition may use its own modules directly.
 *
 * CLI discovery/build/publish and delegation contracts are future consumers of
 * this convention, not behavior implemented by this core API.
 */
export interface Partition<
  E extends ElementExports = ElementExports,
  D extends DiagramExports = DiagramExports,
  M extends MetamodelExports = MetamodelExports,
> {
  readonly id: string;
  readonly name: string;
  readonly elements: PublishedElements<E>;
  readonly diagrams: PublishedDiagrams<D>;
  readonly metamodel: { readonly [K in keyof M as K & string]: M[K] };
}

/**
 * Publish locally maintained contributions; only id and name are required.
 * Any combination of elements, diagrams, and metamodel is valid, including none.
 * Omitted groups become empty immutable mappings in the returned partition.
 *
 * Copies and freezes publication containers and snapshots set membership, keeping
 * element/definition identities, iteration order, and supplied diagram text.
 * Model state passes through unchanged: authors maintain its immutability.
 * No child loading, metamodel inheritance, selection expansion, or rendering occurs.
 */
export function definePartition<
  E extends ElementExports = {},
  D extends DiagramExports = {},
  M extends MetamodelExports = {},
>(input: { id: string; name: string; elements?: E; diagrams?: D; metamodel?: M }): Partition<E, D, M> {
  const elements: ElementExports = Object.create(null);
  const diagrams: DiagramExports = Object.create(null);
  const metamodel: MetamodelExports = Object.create(null);

  for (const key of Object.keys(input.elements ?? {})) {
    elements[key] = readonlySet(input.elements![key]!);
  }
  for (const key of Object.keys(input.diagrams ?? {})) {
    const source = input.diagrams![key]!;
    const data = readonlySet(source.data);
    diagrams[key] = Object.freeze({ data, inNotation: source.inNotation, fileExtension: source.fileExtension });
  }
  for (const key of Object.keys(input.metamodel ?? {})) {
    metamodel[key] = input.metamodel![key]!;
  }

  // All own string keys were copied above; mapped types preserve their exact
  // compile-time keys while removing mutable collection methods from the result.
  return Object.freeze({
    id: input.id,
    name: input.name,
    elements: Object.freeze(elements),
    diagrams: Object.freeze(diagrams),
    metamodel: Object.freeze(metamodel),
  }) as Partition<E, D, M>;
}
