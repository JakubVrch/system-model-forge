# Implementation Plan: Extensible Graph Core

**Branch**: `001-governed-model-core` | **Date**: 2026-10-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification for extensible node and edge classes, instance creation, graph traversal, and deterministic diagram export.

## Summary

Implement a focused TypeScript core library with extensible `Node` and `Edge`
classes, direct traversal from either element (`Node.edges`, `Node.outgoing`, and
`Node.incoming` arrays of connected edges, `Edge.from`/`Edge.to` endpoints, all
references to existing objects, further filtered with
native arrays), and a deterministic text
diagram exporter over caller-supplied element arrays. `Edge` instances keep
direct references to both endpoints and privately register with defined
nodes so that incident edges are directly accessible. `undefined` is a valid
endpoint for a missing node, and creation never throws
for missing endpoints, so incomplete bulk imports still build a
model; validation is a later feature. Element subclasses can
override notation. Selection remains ordinary JavaScript array filtering; no
partition assembly, metamodel governance, query language, CLI, or additional
model operations are included.

## Technical Context

**Language/Version**: TypeScript on Node.js 24 LTS (the repository's current TypeScript/Node development container)

**Primary Dependencies**: Node.js standard library only at runtime; TypeScript and Vitest for build-time and test development

**Package Manager**: Yarn; use a single root library package for this feature

**Storage**: N/A; graph instances and traversal indexes are in memory

**Testing**: Vitest unit, type-level, and integration tests; TypeScript strict type-checking

**Target Platform**: Node.js 24 LTS on developer and CI hosts

**Project Type**: TypeScript library

**Performance Goals**: Traverse immediate node connections and export the reference selection interactively; produce byte-identical output across 100 repeated exports

**Constraints**: Native ESM; keep core fields and endpoints readonly; keep node edge storage private and expose frozen arrays of references; preserve parallel edges, self-loops, and cycles; use deterministic textual output; do not add built-in element filtering

**Scale/Scope**: `Node`, `Edge`, private edge registration, and a diagram exporter; no partitions, assembly, metamodel, ownership/governance, standalone query/filter API, CLI, or unrelated model functions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Pre-design gate: PASS**

- **Model-as-Source**: model instances and element specializations are authored in TypeScript source; diagrams are derived output.
- **Graph-First Architecture**: `Node` and `Edge` are first-class elements with direct endpoint references and runtime traversal.
- **Composable, Package-Bounded Design**: this feature is limited to the core library's public class and function surface; partition contracts and model package composition remain separate feature work.
- **Immutability of Shared Exports**: edge endpoints are readonly; adjacency storage is private and exposed only as frozen arrays of references. Edge construction updates this internal adjacency bookkeeping so direct node-to-edge traversal works; published partition immutability is defined in the separate partition feature.
- **Deterministic, Validateable Builds**: notation and diagram output have explicit deterministic contracts and repeatability tests.
- **Host-Language First**: use TypeScript classes, inheritance, native arrays, and standard collections; do not create a custom filtering language or depend on a graph framework for immediate adjacency.
- **Additional constraints**: remains within the required TypeScript core and textual diagram scope; partition governance, connectors, and unresolved-reference management are excluded; only minimal tolerance (`undefined` endpoints, no throwing) is included, with validation deferred.

**Post-design gate: PASS**

The public contract uses standard TypeScript inheritance and readonly
references. Private construction-time adjacency registration is necessary for
the specified direct node-to-edge traversal; consumers cannot mutate the
adjacency collection itself. Partition-level shared-export freezing is handled
in the separate partition feature. No additional project or unjustified
constitutional violation is required.

## Project Structure

### Documentation (this feature)

```text
specs/001-governed-model-core/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── element-traversal-contract.md
│   └── typescript-declaration-contract.md
└── tasks.md              # Phase 2 output; not created by this command
```

### Source Code (repository root)

```text
package.json
tsconfig.json
vitest.config.ts
src/
├── element/
│   ├── model-element.ts
│   ├── node.ts
│   ├── edge.ts
│   └── adjacency.ts
├── export/
│   └── export-diagram.ts
└── index.ts
tests/
├── type/
├── integration/
└── unit/
```

**Structure Decision**: Implement one TypeScript library package at the
repository root. Element classes, private adjacency support, and exporter have
separate source modules and are re-exported from the package entry point. No
workspace, CLI, or model-definition package is introduced by this feature.

## Complexity Tracking

No constitutional violations require justification.
