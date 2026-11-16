# Implementation Plan: Define Model Partitions

**Branch**: `004-define-model-partitions` | **Date**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-define-model-partitions/spec.md`

## Summary

Add a typed `definePartition` publication boundary exposing `id`, `name`, `elements`, `diagrams`, and `metamodel`. Preserve exact named keys, concrete element types, callable definition signatures, and source identity. Copy and freeze export records, snapshot collection membership with existing `readonlySet`, and protect supported nested model data in place at publication. Document a named `partition` export from a root `*.partition.ts` file with `metamodel/`, `elements/`, and `diagrams/` folders. Adapt the existing microservice environment into six partitions: one root, databases, topics, and a services partition containing service A and service B, using native imports and existing query and diagram capabilities.

Publication protection is deliberately separate from `defineElement`, whose existing shallow-freeze semantics remain unchanged. Live adjacency remains compatible with later cross-partition edge construction. The authoring contract requires plain own data and pure behavior; unsupported mutable payloads fail explicitly. Details and alternatives are recorded in [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript declared as ^5.8.3, strict NodeNext modules, ES2023 target; Node.js >=24.

**Primary Dependencies**: Existing core `GraphElement`, `ElementDefinition`, `readonlySet`, selection utilities, `exportDiagram`, and `saveDiagram`; no new runtime dependency.

**Storage**: Source modules; in-memory publication snapshots; existing file saving only for generated diagram validation.

**Testing**: Vitest unit/integration tests and existing type-test support; TypeScript no-emit checks and declaration build.

**Target Platform**: Existing Node.js ESM library environment.

**Project Type**: TypeScript core library with source-authored examples.

**Performance Goals**: Publication work proportional to total exported membership plus reachable supported own-data properties, with visited-object tracking. No unrelated graph traversal or repeated processing of shared data. Stable reads and deterministic output across 100 reference repetitions; no speculative latency threshold.

**Constraints**: Preserve element and definition identity, generic inference, runtime immutable membership and supported own data, existing graph semantics, and native module use. Do not add global ownership/identity checks, a resolver, automatic discovery, a CLI, or arbitrary-object sandboxing.

**Scale/Scope**: One publication API, two public types, one internal protection helper, focused unit/type tests, and six partitions within the existing microservice fixture. Integration coverage stays in `microservice-environment.test.ts`; existing service event diagrams remain the reference outputs.

## Constitution Check

*Pre-research gate: passed. Post-design gate: passed within the documented source-authoring contract below; no constitution exception requested.*

| Principle | Pre-research assessment | Post-design evidence |
| --- | --- | --- |
| I. Model-as-Source | Source-defined partition fits existing authoring | Entry modules and fixtures are version-controlled; diagram text remains derived |
| II. Graph-First | Preserve nodes, edges, and runtime navigation | Identity retained; endpoint references protected; WeakMap adjacency remains live |
| III. Package-Bounded Composition | Native imports provide explicit boundaries | Model consumers use partition entry exports; child authoring uses the explicitly public shared services metamodel barrel without importing the root assembly |
| IV. Immutable Shared Exports | Requires more than shallow instance freeze | Membership snapshots, frozen copied records, in-place protection of supported own data, rejected unsupported payloads, and mutation tests |
| V. Deterministic Builds | Existing export path remains available | Exact order/text preservation, repeated reads, saved output comparison, complete test/type/build checks |
| VI. Host-Language First | No custom module infrastructure needed | TypeScript generic checking, native imports, Object.freeze, existing sets and tests |

Immutability does not claim to sandbox arbitrary executable classes: supported authored methods must be pure and published state must use the documented data forms. Derived adjacency is not immutable partition-owned state. The implementation must document and test these distinctions; silently accepting mutable payload forms or freezing only top-level instances fails the gate.

Workflow during implementation: add failing behavior/type/mutation tests first; implement the smallest publication API; validate composition and navigation; save and compare textual output; review exported declarations and runtime protection. This planning stage changes documentation only.

## Project Structure

### Documentation (this feature)

```text
specs/004-define-model-partitions/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/partition-contract.md
└── checklists/requirements.md
```

`tasks.md` is produced by the separately requested tasks stage.

### Source Code (repository root)

```text
src/
├── index.ts                              # expose new public API/types
├── partition/
│   ├── define-partition.ts               # contract types and publication
│   └── protect-published-data.ts         # internal preflight/freeze policy
├── collection/readonly-set.ts            # reuse
└── element/                              # preserve current semantics

tests/
├── unit/
│   ├── define-partition.test.ts
│   └── protect-published-data.test.ts
├── type/partition.test-d.ts
└── integration/
    ├── microservice-environment.test.ts   # extend existing acceptance coverage
    └── fixtures/microservice-environment/
        ├── microservice-environment.partition.ts
        ├── metamodel/index.ts            # aggregate public child definitions
        ├── elements/index.ts             # aggregate child selections
        ├── diagrams/index.ts             # re-export service diagram records
        └── partitions/
            ├── databases/
            │   ├── databases.partition.ts
            │   ├── metamodel/
            │   │   ├── index.ts
            │   │   └── database-node.ts
            │   ├── elements/index.ts
            │   └── diagrams/index.ts     # empty group
            ├── topics/
            │   ├── topics.partition.ts
            │   ├── metamodel/
            │   │   ├── index.ts
            │   │   └── topic-node.ts
            │   ├── elements/index.ts
            │   └── diagrams/index.ts     # empty group
            └── services/
                ├── services.partition.ts
                ├── metamodel/            # shared service vocabulary
                │   ├── index.ts          # public, independent of assembly
                │   ├── service-node.ts
                │   ├── module-node.ts
                │   ├── module-composition.ts
                │   ├── event-flow.ts
                │   └── database-usage.ts
                ├── elements/index.ts     # combine A/B selections
                ├── diagrams/index.ts     # expose A/B event diagrams
                └── partitions/
                    ├── service-a/
                    │   ├── service-a.partition.ts
                    │   ├── metamodel/index.ts
                    │   ├── elements/
                    │   │   ├── service.ts
                    │   │   ├── modules.ts
                    │   │   ├── relationships.ts
                    │   │   └── index.ts
                    │   └── diagrams/event-overview.ts
                    └── service-b/
                        ├── service-b.partition.ts
                        ├── metamodel/index.ts
                        ├── elements/
                        │   ├── service.ts
                        │   ├── modules.ts
                        │   ├── relationships.ts
                        │   └── index.ts
                        └── diagrams/event-overview.ts
README.md                                # public API and layout guide
```

**Structure Decision**: Each partition contains only its own entry, `metamodel/`, `elements/`, `diagrams/`, and optional `partitions/` for children. Move existing fixtures into this recursive layout while preserving model identities, ordering, and notation. Import `*.partition.ts` explicitly; remove redundant partition-level barrels. Integration coverage remains in `microservice-environment.test.ts`.

### Partition responsibilities and exports

Paths below are relative to the microservice fixture root.

| Entry | `id` | `elements` keys | `diagrams` keys | `metamodel` keys |
| --- | --- | --- | --- | --- |
| `microservice-environment.partition.ts` | `microservice-environment` | `all`, `services`, `topics`, `databases` | `serviceAEvents`, `serviceBEvents` | all seven definitions, aggregated unchanged |
| `partitions/databases/databases.partition.ts` | `databases` | `databaseA`, `databaseB`, `databases` | none initially | `database` |
| `partitions/topics/topics.partition.ts` | `topics` | `sharedTopic`, `topicA`, `topicB`, `unrelatedTopic`, `topics` | none initially | `topic` |
| `partitions/services/services.partition.ts` | `services` | `services`, `serviceA`, `serviceB`, `all` | `serviceAEvents`, `serviceBEvents` | `service`, `module`, `moduleComposition`, `eventFlow`, `databaseUsage` |
| `partitions/services/partitions/service-a/service-a.partition.ts` | `service-a` | `service`, `modules`, `relationships`, `localModel` | `eventOverview` | shared five definitions reused |
| `partitions/services/partitions/service-b/service-b.partition.ts` | `service-b` | `service`, `modules`, `relationships`, `localModel` | `eventOverview` | shared five definitions reused |

Human-readable names are Microservice environment, Databases, Topics, Services, Service A, and Service B respectively. Every element export is a set, including singleton service and infrastructure exports. Existing element IDs remain unchanged. A fixture-local checked singleton helper may unpack singleton selections when constructing relationships.

The services partition owns the common service metamodel. Its `services` set contains the two service nodes, `serviceA` and `serviceB` expose their respective local models, and `all` combines A then B local models. Its diagrams forward each child's supplied event overview. The root combines services `all`, topics, then databases; root `services` forwards the two-service selection. Root diagrams forward the services partition's two diagram records. Aggregation preserves source references and first-seen order without regenerating text.

### Metamodel ownership and dependency direction

- Databases owns `DatabaseNode`/`database`; topics owns `TopicNode`/`topic`. Their entry files also export the associated types.
- Services owns `ServiceNode`, `ModuleNode`, `ModuleComposition`, `EventFlow`, and `DatabaseUsage`. Both service children reuse those exact definitions. Their own metamodel folders expose selected shared definitions and can hold future local types; do not duplicate shared classes or invent local types.
- `partitions/services/metamodel/index.ts` is the explicit shared-definition entry for child authoring, independent of `services.partition.ts`. Child services must not import their parent's assembly entry, which imports them. Shared relationship files use type-only imports from topic/database partition entries for endpoint types.
- Services A/B import infrastructure instances through the topics/databases partition entries. Their elements import their local metamodel barrel; diagrams import local elements and existing query utilities. Internal files never import their own partition entry.
- Services assembly imports A/B entries. Root assembly imports databases, topics, and services entries. The root metamodel aggregates public definitions for external consumers only; descendants do not import it. Thus runtime dependencies flow from infrastructure/shared vocabulary to service children to services assembly to root assembly.
- The optional `partitions/` folder is an authoring convention only. There is no new `children` field, automatic loader, ownership inference, or framework dependency resolver.
- Update fixture imports to explicit entry paths. Update both TypeScript and Vitest alias configuration if retaining aliases; retire the ambiguous root `@metamodel` dependency in child code. Existing tests can import definitions through the root entry or explicit owning entries; internal service authoring uses the services shared metamodel entry.

### Migration and integration validation

1. Relocate leaf definitions and keep their callable/type exports stable. Move shared service definitions to the services metamodel. Update old `@metamodel` imports and aliases consistently with the dependency rules above.
2. Split infrastructure declarations into their `elements/` folders; publish singleton and aggregate sets, with empty diagram groups.
3. Split service construction from event-overview selection/text generation. Keep the existing select → traverse → union → clean pipeline and all current edge ordering.
4. Publish service A/B, then their services parent, then assemble the root from services, topics, and databases exports. Audit all fixture import sites, including unit/type tests, and update access paths without changing expected model semantics.
5. Extend `tests/integration/microservice-environment.test.ts` to verify all six identities, aggregate memberships, shared references, metamodel reuse, root/services/child diagram equality, mutation resistance, and 100 stable reads. Save the published `inNotation` text and compare it with the current exact expected A/B strings; also regenerate from published `data` to prove compatibility with the exporter.
6. Retain focused unit/type tests for malformed inputs and protection edge cases. Validate that later edge creation to published infrastructure nodes updates fresh adjacency without altering earlier snapshots or partition sets. Use fresh test-created nodes for this assertion to avoid mutating shared fixture adjacency between tests.


## Phase 0: Research Results

[research.md](research.md) resolves public names/inference, membership alias isolation, nested-data immutability, adjacency compatibility, folder examples, and validation strategy. Repository inspection and independent immutability research informed the decisions. Official language documentation supports the generic and freeze semantics. No unresolved research items remain.

## Phase 1: Design and Validation

- [data-model.md](data-model.md) specifies fields, lifecycle, supported state, and publication effects on aliases.
- [contracts/partition-contract.md](contracts/partition-contract.md) specifies the public boundary, type guarantees, errors, native-module convention, and conformance coverage.
- [quickstart.md](quickstart.md) specifies runnable acceptance validation after implementation.

Coverage mapping: FR-001–005 and FR-008–009 use declaration/type and publication tests; FR-006–007 use mutation, alias, reference, unsupported-state, and order tests; FR-010–012 use the six nested microservice partitions and README guidance; FR-013 uses traversal, selection, export, and later-edge compatibility tests. SC-001–006 are covered by the existing microservice consumer test, exact expected contents, mutation attempts, 100 reads, malformed declarations, and documented commands.

## Complexity Tracking

No constitutional violations or exceptions. The internal data-protection helper is needed because existing shallow freezing cannot meet partition publication requirements. It is limited to supported own data and does not become a general serialization, dependency, or security framework.
