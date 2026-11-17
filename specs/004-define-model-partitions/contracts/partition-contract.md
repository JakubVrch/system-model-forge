# Public Contract: Model Partitions

## Core exports and declaration shape

Add runtime `definePartition` and type exports `Partition` and `PartitionDiagram` to `src/index.ts`. The following is the required public shape; generic implementation spelling may vary provided the inference guarantees below pass.

```typescript
interface PartitionDiagram<T extends GraphElement = GraphElement> {
  readonly data: ReadonlySet<T>;
  readonly inNotation: string;
}

// Each group retains its specific keys and value types in the inferred result.
interface Partition<Elements, Diagrams, Metamodel> {
  readonly id: string;
  readonly name: string;
  readonly elements: Readonly<Elements>;
  readonly diagrams: Readonly<Diagrams>;
  readonly metamodel: Readonly<Metamodel>;
}
```

`definePartition` requires `id` and `name`; `elements`, `diagrams`, and `metamodel` are optional. Omitted groups normalize to frozen empty mappings, with exact empty inferred types. Its generic constraints require every element entry to be a ReadonlySet of GraphElement, every diagram entry to match PartitionDiagram, and every metamodel entry to be an ElementDefinition. Supply broad default generic arguments for `Partition` so consumers can annotate an arbitrary partition without providing all arguments. Use a constraint that accommodates heterogeneous definition argument tuples; do not erase the inferred callable signatures or use `unknown[]` contravariance in a way that rejects required domain arguments.

Returned element and diagram collections expose ReadonlySet, even for mutable Set inputs; mutator methods must not survive in their inferred result types. The result exposes readonly diagram fields, exact export keys, concrete member subtypes, and unchanged metamodel signatures. Model state remains author-owned; publication neither inspects nor freezes it, and existing element subtype APIs remain intact.

## Entry convention

Each partition has one `[name].partition.ts` entry exporting a named `partition`.
The folder tree is the sole hierarchy source: a partition's parent is the nearest
ancestor folder containing a partition entry. Intermediate organizational folders
need no declaration. Supporting folders use `_` prefixes (`_metamodel/`,
`_elements/`, `_diagrams/`, or `_shared/`); their contents are excluded from future
hierarchy discovery. Files themselves have no prefix: small contributions can live
in `elements.ts` and `diagrams.ts`. Empty categories need no files or folders.

Partition entries publish locally maintained contributions, not forwarded child
exports. A locally maintained selection or diagram can reference foreign elements.
All three contribution groups are optional inputs and normalize to frozen empty
mappings in the output. Identity-only and vocabulary-only partitions are valid.
Metamodel ownership is independent of hierarchy: imports can flow top-down,
bottom-up, or across branches. Cross-partition imports use partition entries, including vocabulary imports.
Consumers retrieve individual elements by ID from the published sets. Core does not infer or enforce ownership.

There is no `children` registry. CLI discovery/build/publish and delegation contracts
are future work; this change establishes their folder convention without implementing
a scanner, contract engine, or placeholder contract files.

## Publication guarantees

- `id`, `name`, export keys, and diagram strings are preserved exactly.
- Mapping and diagram record inputs are copied; set membership is snapshotted with `readonlySet`.
- Every result mapping uses own-key lookup semantics with no inherited fallback. Special string keys remain safe data keys.
- Members and definitions retain strict reference identity; sets retain insertion order and reference uniqueness.
- Published shell, mappings, diagram records, and set membership resist mutation at runtime.
- Elements, endpoints, definitions, and guards pass through by reference without recursive inspection or freezing. Their own data and payload types are not validated by publication; getters on those values are not invoked.
- Authors maintain immutable model state through readonly fields, immutable collections, and suitable model APIs. Publication does not add deeper enforcement to `defineElement`'s existing shallow freeze.
- Graph adjacency remains live. Later edges can change fresh adjacency reads without changing prior snapshots or partition membership.
- TypeScript validates declaration shapes. No general external-data parser is introduced.

## Compatibility and errors

No uniqueness registry, dependency graph checks, ownership mutation, identifier rewriting, automatic rendering, or filesystem scanning is introduced. Existing missing endpoint and selection semantics remain unchanged. A missing key is absent, while a present empty set remains present. No text is generated implicitly for empty diagrams.

Type checks must reject missing identity/name, non-string identity/name/text, array element collections, malformed diagram records, and non-definition metamodel entries. Exact inferred keys reject misspelled static lookups. Broad dynamic lookups use the project's `noUncheckedIndexedAccess` behavior.

## Required conformance coverage

- Both native Set and existing readonlySet inputs; later edits to every caller-owned container.
- Native and reflective mutation attempts on shells, mappings, diagram fields, and membership.
- Element payloads and guards remain untouched through child and parent publication; own element getters are never invoked.
- Overlapping sets, same-ID distinct instances, foreign diagram members, empty groups, empty text, absent names, and special keys.
- Metamodel argument inference, return types, `.is` narrowing, callable identity, and normal construction.
- Existing query/export behavior and new edges connecting already published nodes.
- The existing microservice fixture organized as one root, databases, topics, services, and two service children, consumed through public entries; shared metamodel reuse through the services partition entry; local contribution boundaries, shared infrastructure identity, two unchanged service diagrams, and saved textual output in `microservice-environment.test.ts`.
