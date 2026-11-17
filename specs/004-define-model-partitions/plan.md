# Implementation Plan: Define Model Partitions

**Branch**: `004-define-model-partitions` | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-define-model-partitions/spec.md`

## Summary

Add a typed `definePartition` publication boundary exposing `id`, `name`, `elements`, `diagrams`, and `metamodel`. Preserve exact named keys, concrete element types, callable definition signatures, and source identity. Copy and freeze export records, snapshot collection membership with existing `readonlySet`, and pass model state through unchanged. Document a named `partition` export from `[name].partition.ts`, optional contribution groups, and underscore-prefixed supporting folders. Adapt the existing microservice environment into six partitions: one root, databases, topics, and a services partition containing service A and service B, using native imports and existing query and diagram capabilities.

Publication protection is deliberately separate from `defineElement`, whose existing shallow-freeze semantics remain unchanged. Live adjacency remains compatible with later cross-partition edge construction. Authors maintain immutable model state; publication imposes no payload restrictions or recursive enforcement. Details and alternatives are recorded in [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript declared as ^5.8.3, strict NodeNext modules, ES2023 target; Node.js >=24.

**Primary Dependencies**: Existing core `GraphElement`, `ElementDefinition`, `readonlySet`, selection utilities, `exportDiagram`, and `saveDiagram`; no new runtime dependency.

**Storage**: Source modules; in-memory publication snapshots; existing file saving only for generated diagram validation.

**Testing**: Vitest unit/integration tests and existing type-test support; TypeScript no-emit checks and declaration build.

**Target Platform**: Existing Node.js ESM library environment.

**Project Type**: TypeScript core library with source-authored examples.

**Performance Goals**: Publication work proportional to exported mapping entries and collection membership. No traversal of model data or endpoints. Stable reads and deterministic output across 100 reference repetitions; no speculative latency threshold.

**Constraints**: Preserve element and definition identity, generic inference, runtime immutable publication containers and membership, existing graph semantics, and native module use. Do not add global ownership/identity checks, a resolver, automatic discovery, a CLI, or arbitrary-object sandboxing.

**Scale/Scope**: One publication API, two public types, focused unit/type tests, and six partitions within the existing microservice fixture. Integration coverage stays in `microservice-environment.test.ts`; existing service event diagrams remain the reference outputs.

## Constitution Check

*Pre-research gate: passed. Post-design gate: passed within the documented source-authoring contract below; no constitution exception requested.*

| Principle | Pre-research assessment | Post-design evidence |
| --- | --- | --- |
| I. Model-as-Source | Source-defined partition fits existing authoring | Entry modules and fixtures are version-controlled; diagram text remains derived |
| II. Graph-First | Preserve nodes, edges, and runtime navigation | Identity retained; endpoint references unchanged; WeakMap adjacency remains live |
| III. Package-Bounded Composition | Native imports provide explicit boundaries | Model consumers use partition entry exports; child authoring imports the services partition entry, which publishes vocabulary without importing children |
| IV. Immutable Shared Exports | Model state is immutable by author design | Framework protects containers and membership; authors maintain immutable element state |
| V. Deterministic Builds | Existing export path remains available | Exact order/text preservation, repeated reads, saved output comparison, complete test/type/build checks |
| VI. Host-Language First | No custom module infrastructure needed | TypeScript generic checking, native imports, Object.freeze, existing sets and tests |

Model authors maintain immutable shared state by design, using readonly fields, immutable collections, and suitable model APIs. Publication protects its own containers and membership only. This uses constitution IV’s design-based option; there is no recursive payload inspection or additional model freezing. Derived adjacency remains live.

Workflow during implementation: add failing behavior/type/mutation tests first; implement the smallest publication API; validate composition and navigation; save and compare textual output; review exported declarations and runtime protection. This planning stage changes documentation only.

## Revised authoring layout (2026-11-17)

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

```text
microservice-environment/
├── microservice-environment.partition.ts
├── topics/
│   ├── topics.partition.ts
│   ├── _metamodel/topic-node.ts
│   └── elements.ts
├── databases/
│   ├── databases.partition.ts
│   ├── _metamodel/database-node.ts
│   └── elements.ts
└── services/
    ├── services.partition.ts
    ├── _metamodel/
    │   ├── index.ts
    │   ├── service-node.ts
    │   ├── module-node.ts
    │   ├── module-composition.ts
    │   ├── event-flow.ts
    │   └── database-usage.ts
    ├── service-a/
    │   ├── service-a.partition.ts
    │   ├── elements.ts
    │   └── diagrams.ts
    └── service-b/
        ├── service-b.partition.ts
        ├── elements.ts
        └── diagrams.ts
```

### Implementation and validation

Make input groups optional while retaining all output groups and their protection.
Retain broad `Partition` annotations; omitted inferred groups have no keys. Keep
set-based element publication. Infrastructure partitions publish one aggregate
collection each; authoring imports partition entries and retrieves individual instances by ID from published sets. Consolidate service construction into one elements file per owner.
Root publishes identity only; services publishes its five definitions only. Topics
and databases retain their own definitions and selections; service children retain
one local model selection and their own event diagram, without inherited metamodel exports.

Update consumer imports and test local ownership, vocabulary reuse, shared endpoint
identity, stable order/membership, immutable publication, and unchanged saved diagram
text. Run typecheck, full tests, and build. No new dependency or CLI is introduced.

## Phase 0: Research Results

[research.md](research.md) resolves public names/inference, membership alias isolation, author-owned model state, adjacency compatibility, folder examples, and validation strategy. Repository inspection and independent immutability research informed the decisions. Official language documentation supports the generic and freeze semantics. No unresolved research items remain.

## Phase 1: Design and Validation

- [data-model.md](data-model.md) specifies fields, lifecycle, supported state, and publication effects on aliases.
- [contracts/partition-contract.md](contracts/partition-contract.md) specifies the public boundary, type guarantees, errors, native-module convention, and conformance coverage.
- [quickstart.md](quickstart.md) specifies runnable acceptance validation after implementation.

Coverage mapping: FR-001–005 and FR-008–009 use declaration/type and publication tests; FR-006–007 use mutation, alias, reference, author-owned-state, and order tests; FR-010–012 use the six nested microservice partitions and README guidance; FR-013 uses traversal, selection, export, and later-edge compatibility tests. SC-001–006 are covered by the existing microservice consumer test, exact expected contents, mutation attempts, 100 reads, malformed declarations, and documented commands.

## Complexity Tracking

Publication uses existing sets and native object freezing for its own containers.
No recursive model-data helper, payload whitelist, or additional model enforcement is required.
