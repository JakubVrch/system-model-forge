# Quickstart Validation: Define Model Partitions

## Prerequisites

Use Node.js >=24 and the repository's installed development dependencies. If dependencies are absent, run `npm ci` at the repository root. This guide describes validation after feature 004 implementation; the API and fixture files are planned artifacts, not existing functionality at the planning stage.

Read the public shapes and authoring restrictions in [the partition contract](contracts/partition-contract.md), and the publication lifecycle in [the data model](data-model.md).

## Inspect the authoring convention

Open `tests/integration/fixtures/microservice-environment/microservice-environment.partition.ts`. Confirm the root publishes `all`, `services`, `topics`, and `databases` element sets, two service event diagrams, and the seven existing metamodel definitions.

Inspect root children under `partitions/databases/`, `partitions/topics/`, and `partitions/services/`. Services contains its own children under `partitions/service-a/` and `partitions/service-b/`. Each of these six partitions has an entry file, `metamodel/`, `elements/`, and `diagrams/`; only parent partitions have `partitions/`.

The services metamodel owns shared service definitions. Database/topic definitions belong to their own partitions. Verify that service children use the independent services metamodel barrel and never import services or root assembly entries. Follow the ownership/export table in [plan.md](plan.md). Verify both diagrams are exposed unchanged from service child through services to root, preserving member identity throughout.

## Run focused validation

From the repository root:

```sh
npm run typecheck
npm test -- tests/unit/define-partition.test.ts tests/unit/protect-published-data.test.ts tests/integration/microservice-environment.test.ts
```

Type checks include `tests/type/partition.test-d.ts` through the repository tsconfig. Expected compile-time coverage: exact keys and set subtypes, no exposed collection mutators, preserved definition argument tuples and `.is` narrowing, plus expected errors for missing groups and malformed declarations.

Expected runtime outcomes:

1. Consumers obtain all named exports from the entry point; collection membership and reference identity match expectations.
2. Changing caller-owned sets, mappings, or diagram records after publication leaves the published partition unchanged.
3. Mutation attempts on published fields and nested supported data fail without changing values. Cyclic data terminates safely; already frozen parents do not leave mutable children unprotected.
4. Unsupported mutable payloads produce a path-bearing TypeError. Own getters are not executed during protection; known unsupported shapes fail before any freezing phase.
5. A new edge connecting published nodes appears in a fresh adjacency read. Earlier adjacency snapshots and named element/diagram sets remain unchanged.
6. Root and service diagram exports retain the existing Service A/B selections and exact expected text. Empty data/text and absent keys behave as documented.
7. The microservice test uses existing query operations, compares `exportDiagram` output with published `inNotation`, and saves that published text using `saveDiagram` to a temporary directory. Readback must match expected text exactly; tests clean up their temporary files.
8. One hundred repeated reads preserve names, order, memberships, identities, and text.

## Complete regression and build validation

```sh
npm test
npm run build
```

Expected outcome: existing graph, shallow `defineElement`, selection, and export tests still pass. Generated declarations expose `definePartition`, `Partition`, and `PartitionDiagram` from the package root with preserved generic information. Build artifacts remain governed by existing repository ignore conventions.

No framework CLI, filesystem discovery, dependency registry, or output regeneration is needed to consume the partition. README instructions should reproduce this workflow using ordinary imports and explain the supported immutable-data contract.
