# Research: Define Model Partitions

## Current authoring decision (2026-11-17)

The user revised the earlier mandatory-folder and parent-forwarding decisions.
The convention below supersedes earlier layout/group requirements in this research
record. Existing publication protection decisions remain unchanged.

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
bottom-up, or across branches. Authors may expose independent vocabulary modules
without importing assembled instances. Core does not infer or enforce ownership.

There is no `children` registry. CLI discovery/build/publish and delegation contracts
are future work; this change establishes their folder convention without implementing
a scanner, contract engine, or placeholder contract files.


## Evidence and resolved questions

Repository inspection covered `src/element/{define-element,node,edge,adjacency}.ts`, `src/collection/readonly-set.ts`, `src/export/export-diagram.ts`, existing integration fixtures, and `tests/type/define-element.test-d.ts`. A dedicated research agent independently reviewed publication immutability and adjacency. All planning unknowns are resolved below.

### 1. Public partition shape and inference

**Decision**: Export `definePartition`, `Partition`, and `PartitionDiagram` from the core barrel. A partition has `id`, `name`, `elements`, `diagrams`, and `metamodel`. Entry modules use `export const partition = definePartition(...)`. Infer each group's exact keys, set member subtypes, and metamodel callable argument tuples and `.is` guards.

**Rationale**: Fits existing `defineElement` and ordinary module composition. TypeScript generics and mapped readonly properties preserve author-defined names rather than reducing all results to a broad dictionary. See the official [generics documentation](https://www.typescriptlang.org/docs/handbook/2/generics.html) and [mapped types documentation](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html).

**Alternatives considered**: A bare interface cannot establish runtime protection. A class, registry, loader, or dependency resolver adds unnecessary state. Direct module exports alone do not give consumers a uniform partition value.

### 2. Membership and identity

**Decision**: Accept `ReadonlySet` inputs (including native sets); snapshot every element set and diagram data set with existing `readonlySet`. Copy export mappings and diagram records and freeze those copies. Keep element and metamodel definition references unchanged. Build mappings from own enumerable string keys and preserve ordinary own-key order; use safe own-property construction so keys such as `__proto__` are data, not prototype mutations. Missing keys must not resolve inherited properties.

**Rationale**: Source-set edits must not affect published membership. Existing snapshots hide their mutable backing set and preserve reference uniqueness and insertion order.

**Alternatives considered**: `Object.freeze(new Set())` does not protect its collection entries; retaining caller-owned records permits later replacement. Cloning elements violates identity requirements.

### 3. Model-state responsibility (revised by user request)

**Decision**: Protect publication containers and membership only. Authors maintain
immutable element state using native TypeScript mechanisms and model APIs. Pass
model instances, endpoints, definitions, and guards through unchanged. Remove the
recursive protection helper, payload restrictions, and preflight.

**Rationale**: Trusted source authors control their model definitions. Publication
should assemble exports without imposing new model semantics or repeatedly walking
nested state during parent aggregation. `defineElement` retains its shallow freeze.

**Superseded alternative**: Recursive inspection and in-place freezing introduced
unexpected alias/endpoint effects, payload restrictions, and redundant work. The user
explicitly replaced that contract with author responsibility for model-state immutability.

### 4. Adjacency remains live

**Decision**: Authors maintain immutable model state; the framework protects named set membership. Derived adjacency remains the existing live graph view, with immutable snapshots per read. Creating a new edge to an exported node can change a later adjacency snapshot, without changing the node's own fields or any partition export set. Test this explicitly.

**Rationale**: `adjacency.ts` stores connections in a private WeakMap and existing traversal behavior allows later edge registration. Graph composition must remain available under FR-013 and constitution II. Publication does not freeze the entire connected graph or capture a graph-wide version.

**Alternatives considered**: Sealing adjacency would break normal cross-module edge construction. Copying nodes or capturing adjacency per partition would break identity or introduce a new graph context model.

### 5. Diagrams, folders, and examples

**Decision**: Keep `inNotation` as supplied text. Adapt the existing microservice fixture into six partitions with recursive `partitions/` folders: root → databases, topics, services; services → service A, service B. Services owns their five shared definitions; databases and topics own their node definitions. Each child service has its own metamodel barrel for shared reuse and future local definitions. The root metamodel only aggregates public definitions.

Services children import their parent's independent `metamodel/index.ts`, not its assembly entry. Infrastructure is consumed through partition entries. Assembly proceeds from child services to services to root without runtime cycles. Use explicit partition entry imports and update existing fixture aliases/import sites. Extend `microservice-environment.test.ts`, preserving its exact expected diagrams.

**Rationale**: Separates each partition's own content from child names and gives the common service vocabulary a natural owner. Native imports remain sufficient; folder nesting adds no runtime hierarchy semantics.

**Alternatives considered**: Mixing children beside root-owned folders obscures ownership. Keeping service vocabulary at root makes its scope broader than necessary. Duplicating definitions per service breaks shared recognition semantics. Separate fixture examples would duplicate the existing model.

### 6. Validation strategy

**Decision**: Use the repository's TypeScript checks, Vitest unit/integration/type tests, and build. Add focused publication tests, compile-time malformed declarations, and the existing microservice end-to-end example with six nested partitions including saved textual output and 100 repeated reads.

**Rationale**: Tests must prove identity, input alias isolation, runtime container protection and unchanged model state, exact inference, and graph compatibility—not only frozen flags. No dependencies or benchmark framework are needed.

**Alternatives considered**: Documentation-only examples do not validate the contract. Elapsed-time targets have no basis in the feature requirements; publication complexity is linear in exported membership and reachable supported own data.
