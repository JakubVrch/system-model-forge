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

`definePartition` accepts one object with all five members. Its generic constraints require every element entry to be a ReadonlySet of GraphElement, every diagram entry to match PartitionDiagram, and every metamodel entry to be an ElementDefinition. Supply broad default generic arguments for `Partition` so consumers can annotate an arbitrary partition without providing all arguments. Use a constraint that accommodates heterogeneous definition argument tuples; do not erase the inferred callable signatures or use `unknown[]` contravariance in a way that rejects required domain arguments.

Returned element and diagram collections expose ReadonlySet, even for mutable Set inputs; mutator methods must not survive in their inferred result types. The result exposes readonly diagram fields, exact export keys, concrete member subtypes, and unchanged metamodel signatures. Nested supported data is runtime-frozen; existing element subtype APIs remain intact rather than globally changing all graph types to recursive mapped types.

## Entry convention

Each folder exposes a named `partition` export from `<author-chosen-name>.partition.ts` at its root. Multiple consumers can alias that export using native imports. Additional type-only exports are allowed. No default export, registration call, discovery loader, or package manifest is required.

```text
microservice-environment/
├── microservice-environment.partition.ts
├── metamodel/
├── elements/
└── diagrams/
```

Subfolders may contain further files or subfolders. Empty categories still have their directory represented in the example/source convention, using a placeholder file when version control requires one. Model consumers access other partitions through their entry files; internal modules compose their own sources with ordinary imports. A parent may contain children under an optional `partitions/` directory. The services partition exposes its independent public `metamodel/index.ts` for shared vocabulary: service A/B may import it without importing the services assembly. See plan.md for the six-partition recursive layout and acyclic import rules. Nesting adds no fields or loading behavior to the core contract.

## Publication guarantees

- `id`, `name`, export keys, and diagram strings are preserved exactly.
- Mapping and diagram record inputs are copied; set membership is snapshotted with `readonlySet`.
- Every result mapping uses own-key lookup semantics with no inherited fallback. Special string keys remain safe data keys.
- Members and definitions retain strict reference identity; sets retain insertion order and reference uniqueness.
- Published shell, mappings, diagram records, supported own element state, and definition surfaces resist mutation at runtime. Attempts fail or return an unsuccessful reflection result; they never change the publication.
- Nested own data is traversed even when its parent was already frozen. Cycles terminate; shared objects are processed once.
- Own descriptor inspection must not invoke getters. Unsupported state fails with a TypeError identifying the group/key/property path. Complete preflight precedes freezing for supported ordinary inputs.
- The author must use plain data for published state and pure methods/accessors for behavior. Hidden private or closure-backed mutations, proxies, arbitrary metadata class instances, and prototype modification are outside the supported contract. Map/Set/Date/typed-array payloads and own accessors are rejected rather than falsely frozen. Collection sets at the public group boundary remain valid inputs and are snapshotted.
- Do not freeze shared prototypes. Existing `defineElement` behavior outside partition publication stays unchanged.
- Graph adjacency remains live through existing private storage. Later edge construction may change a fresh adjacency read but cannot change prior snapshots, exported set membership, or published own data.
- TypeScript is the declaration validator; publication guards protect immutability and do not become a general external-data parser.

## Compatibility and errors

No uniqueness registry, dependency graph checks, ownership mutation, identifier rewriting, automatic rendering, or filesystem scanning is introduced. Existing missing endpoint and selection semantics remain unchanged. A missing key is absent, while a present empty set remains present. No text is generated implicitly for empty diagrams.

Type checks must reject absent groups, non-string identity/name/text, array element collections, malformed diagram records, and non-definition metamodel entries. Exact inferred keys reject misspelled static lookups. Broad dynamic lookups use the project's `noUncheckedIndexedAccess` behavior.

## Required conformance coverage

- Both native Set and existing readonlySet inputs; later edits to every caller-owned container.
- Native mutation and reflective mutation attempts on shells, maps, diagram fields, and shared own state.
- Nested arrays/records, cycles, symbols, non-enumerable fields, already frozen parents, unsupported mutable payloads, and own getters never invoked.
- Overlapping sets, same-ID distinct instances, foreign diagram members, empty groups, empty text, absent names, and special keys.
- Metamodel argument inference, return types, `.is` narrowing, callable identity, and normal construction.
- Existing query/export behavior and new edges connecting already published nodes.
- The existing microservice fixture organized as one root, databases, topics, services, and two service children, consumed through public entries; shared metamodel reuse through its independent public barrel; two unchanged service diagrams, saved textual output, and 100 stable repeated reads in `microservice-environment.test.ts`.
