# Research: Define Model Partitions

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

### 3. Runtime element protection and supported authoring contract

**Decision**: Add a partition-local publication helper; do not change `defineElement`'s existing shallow-freeze behavior globally. Before publication, inspect the complete supported own-data graph, then freeze it in place. Visit all own string and symbol data descriptors, including non-enumerable properties; use a visited set for shared references and cycles. Continue through children of already frozen objects. Follow edge endpoint references, but do not enumerate prototype getters or graph adjacency.

Supported state consists of primitives, ordinary objects (including null-prototype records), arrays, and Node/Edge instances. Reject unsupported nested mutable values such as Map, Set, Date, typed arrays, custom metadata class instances, and own accessor properties with an export/property path. Top-level collection sets are handled by snapshotting, so they are not rejected. Metamodel values must be existing `defineElement` definitions; freeze their function surface and guard surface, preserving callable identity. Do not traverse callable intrinsic properties or shared class prototypes.

Author-defined model methods, prototype accessors, and definitions must be pure with respect to published state. Private fields, closures, external mutable services, proxies, and prototype modification are not supported ways to store or mutate published state. This is a trusted source-authoring contract, not a sandbox for arbitrary executable objects. A shape inspection cannot prove function purity. Document this boundary explicitly rather than promising an impossible generic freeze of JavaScript execution.

**Rationale**: Existing tests intentionally allow nested objects to remain mutable after `defineElement`. The partition boundary needs stronger guarantees without proxies or replacing graph objects. ECMAScript [SetIntegrityLevel](https://tc39.es/ecma262/2024/#sec-setintegritylevel) operates on own property integrity, so a bounded recursive policy and rejection of unsupported internal-slot state are necessary. Preflight prevents partial freezing for known unsupported shapes; arbitrary hostile proxies are outside the supported contract.

**Alternatives considered**: Shallow freezing fails FR-006 for nested data. A universal proxy membrane changes identities and introduces complex method/collection semantics. Freezing shared prototypes changes unrelated code. Silently accepting unsupported mutable objects falsely claims protection.

### 4. Adjacency remains live

**Decision**: Published own state and named set membership are immutable. Derived adjacency remains the existing live graph view, with immutable snapshots per read. Creating a new edge to an exported node can change a later adjacency snapshot, without changing the node's own fields or any partition export set. Test this explicitly.

**Rationale**: `adjacency.ts` stores connections in a private WeakMap and existing traversal behavior allows later edge registration. Graph composition must remain available under FR-013 and constitution II. Publication does not freeze the entire connected graph or capture a graph-wide version.

**Alternatives considered**: Sealing adjacency would break normal cross-module edge construction. Copying nodes or capturing adjacency per partition would break identity or introduce a new graph context model.

### 5. Diagrams, folders, and examples

**Decision**: Keep `inNotation` as supplied text. Adapt the existing microservice fixture into six partitions with recursive `partitions/` folders: root → databases, topics, services; services → service A, service B. Services owns their five shared definitions; databases and topics own their node definitions. Each child service has its own metamodel barrel for shared reuse and future local definitions. The root metamodel only aggregates public definitions.

Services children import their parent's independent `metamodel/index.ts`, not its assembly entry. Infrastructure is consumed through partition entries. Assembly proceeds from child services to services to root without runtime cycles. Use explicit partition entry imports and update existing fixture aliases/import sites. Extend `microservice-environment.test.ts`, preserving its exact expected diagrams.

**Rationale**: Separates each partition's own content from child names and gives the common service vocabulary a natural owner. Native imports remain sufficient; folder nesting adds no runtime hierarchy semantics.

**Alternatives considered**: Mixing children beside root-owned folders obscures ownership. Keeping service vocabulary at root makes its scope broader than necessary. Duplicating definitions per service breaks shared recognition semantics. Separate fixture examples would duplicate the existing model.

### 6. Validation strategy

**Decision**: Use the repository's TypeScript checks, Vitest unit/integration/type tests, and build. Add focused publication tests, compile-time malformed declarations, and the existing microservice end-to-end example with six nested partitions including saved textual output and 100 repeated reads.

**Rationale**: Tests must prove identity, input alias isolation, runtime nested protection, exact inference, and graph compatibility—not only frozen flags. No dependencies or benchmark framework are needed.

**Alternatives considered**: Documentation-only examples do not validate the contract. Elapsed-time targets have no basis in the feature requirements; publication complexity is linear in exported membership and reachable supported own data.
