# Core Authoring Contract Additions

## Partition diagrams

`PartitionDiagram<T>` retains `readonly data: ReadonlySet<T>` and `readonly inNotation: string` and adds required `readonly fileExtension: string`.

- The extension includes its dot: `.mmd`, `.puml`, or `.txt`. No inferred/default extension.
- Reject empty extension, lone dot, separators, NUL/control characters, traversal components, and invalid final filenames before build writes. Support multipart extensions such as `.diagram.txt`.
- `definePartition` copies the extension into the frozen diagram record without changing text or membership; CLI boundary validation handles malformed runtime sources.
- Migrate every diagram declaration in fixtures, type tests, README, and public examples. Missing extension is a type error for typed declarations and a concise command error for invalid loaded partitions.
- Existing export group optionality, key inference, readonly sets, source references, and author-owned model immutability remain unchanged.

## Element identity and business attributes

`ModelElement` requires `readonly id: string` and provides `getElementInfo(): Readonly<Record<string, string | number | null | undefined>>` with an automatic default. IDs are author-assigned: no generation, uniqueness registry, duplicate-ID rejection, or merging by ID. The same object can appear in multiple exports, and distinct objects sharing an ID remain distinct.

The identity contract is an abstract readonly property, not a forced base-constructor argument. Existing node subclasses declaring an ID already satisfy it. Concrete base Node and Edge must accept an explicit ID; retain existing edge endpoint positions by adding its required ID as the third argument, `Edge(from, to, id)`. Custom edge constructors forward their author-assigned IDs. Migrate all affected constructors, call sites, tests, and examples; do not synthesize IDs from endpoints. `defineElement(Ctor)` keeps its current signature, inference, `.is`, and shallow freezing; no attribute registration options are added.

The default method runs when called, after subclass initialization. It returns a fresh readonly snapshot of own enumerable string-keyed data properties, including only strings, finite numbers, null, and undefined, and excluding `id`, callable values, and framework-owned fields. Unsupported stored values are skipped; there is no automatic recursion or string conversion. Use property descriptors, not ordinary getter enumeration. Edge additionally excludes `from` and `to`; endpoints are separate CLI metadata. Inherited constructor-initialized fields are own properties and included. Prototype properties, accessors, symbols, non-enumerable fields, and `#private` state are not automatically exported. No adjacency traversal or notation method is invoked.

Authors can override `getElementInfo()` to omit fields, rename keys, or return computed values. An override replaces the default record; it may call `super.getElementInfo()` to extend it. Returned values must be strings, finite numbers (integers or decimals), null, or undefined. Richer values require explicit author conversion. Overrides must be synchronous, pure, and return a plain data record; a thrown method or invalid result produces a concise inspection error. No arbitrary getters on returned records are invoked.

Convention: enumerable stored fields are business data. TypeScript `private`/`protected` ordinary fields are indistinguishable at runtime and can be included by the default; internal state must use `#private`, non-enumerable storage, or an override. Do not promise automatic visibility inference. An empty returned record is valid. CLI business-attribute names come from this record, never a separate allowlist. Cache one method result per object per invocation, including objects inspected for endpoint summaries; validate projected keys against full selected exports before limiting.

For EventFlow, existing `kind` is discovered automatically, yielding `{ kind: 'publish' }` without an override or metadata declaration. Its new ID is supplied by the author. CLI records always retain that ID independently of attribute projection. Endpoint identity uses the endpoint ID and optional `name`/`label` returned by its method.

## Graph-kind and model-type recognition

The CLI recognizes graph elements through inheritance from `Node` or `Edge`. Authored models import these classes from the same built `governed-model-core` package as the CLI. `GraphElement` is the TypeScript union `Node | Edge`.

Use the actual class constructor's data-property name as the modelType display value for authored subclasses, or null for base Node/Edge or unavailable names. Read descriptors without invoking getters. This is a descriptive class name, not a stable domain identifier; author-supplied `id` remains identity. No inspection profile, constructor registration, or extra attribute-list API is needed.

## Package layout

All library modules live under `src/core/`, including collection, element, export, partition, query, and the public `index.ts` barrel. `src/cli/` is a sibling and core has no dependency on it. Package-root exports resolve to `dist/core/index.js` and `dist/core/index.d.ts`; the source `@core` alias resolves to `src/core/index.ts`. The exploratory `graphKind` export has been removed.

## Compatibility and validation

Required element IDs and diagram `fileExtension` are breaking authoring changes. Migrate all existing node/edge constructors and fixtures that lack IDs, along with diagram declarations. Document release impact without publishing or choosing a release number in this stage. Existing business fields need no metadata migration.

Test automatic field discovery, framework exclusions, inherited constructor fields, skipped getters, private/non-enumerable storage, custom method overrides, invalid method results, author-assigned IDs, duplicate-ID preservation, factory inference/freezing, and inheritance through the built package. Verify endpoint identity and existing graph/adjacency behavior after constructor migration.
