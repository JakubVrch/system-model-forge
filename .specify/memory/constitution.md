<!--
Sync Impact Report
Version change: 1.0.0 -> 1.1.0
Modified principles: V -> VI (added Host-Language First)
Added sections: none
Removed sections: none
Follow-up TODOs: none
-->

# System Model Forge Constitution

## Core Principles

### I. Model-as-Source
The authoritative representation of a governed model MUST live in version-controlled source artifacts, not only in mutable GUI state or undocumented repositories. Models are engineered software assets: they are composed, reviewed, tested, and released with the same discipline expected of code.

This principle exists because governed models fail silently when they are assembled by hand or drift from real systems. Treating models as source keeps them inspectable, diffable, reproducible, and safe to evolve across teams.

### II. Graph-First Architecture
The core system MUST model entities and relationships as first-class graph constructs: nodes and edges have identity, type, and runtime navigation semantics. Type definitions originate from a metamodel, but navigation is resolved dynamically at runtime across composed packages.

This principle is necessary to support cross-package composition without brittle static coupling. Runtime graph navigation allows model fragments defined in separate packages to interoperate while maintaining a clear graph boundary.

### III. Composable, Package-Bounded Design
Model definitions MUST be package-based and composable. Packages may define metamodel fragments, node types, edge types, queries, and export routines, and may import other packages only through explicit interfaces. Package boundaries MUST remain stable and reviewable.

This principle prevents uncontrolled interdependence and supports microservice-style model composition while keeping governance and ownership clear.

### IV. Immutability of Shared Exports
If a package exports model elements, other packages MUST NOT be able to mutate those exported values or object state. Shared model exports MUST be treated as immutable contracts. Mutation MUST be prevented by design or by strong runtime guards.

This principle is non-negotiable because shared model artifacts are governance boundaries. Without immutability, composition becomes unsafe and validation loses trust.

### V. Deterministic, Validateable Builds
Every model build MUST be deterministic and reviewable. The system MUST support modular composition, validation, reproducible export, and artifact generation from source inputs. Generated views such as diagrams and catalogues are outputs, never the authoritative source of truth.

This principle ensures the project remains governable as the model scales across contributors, packages, and release cycles.

### VI. Host-Language First
The framework MUST leverage the native capabilities of the host language and its ecosystem instead of recreating those capabilities in a custom layer. The project MUST prefer established TypeScript mechanisms for modules, dependency management, testing, build tooling, version control, CI, and developer tooling.

This principle exists to avoid reinvention and to keep the system maintainable. A governed modeling tool should integrate with the host language and tooling instead of building parallel mechanisms that duplicate existing standards.

## Additional Constraints

The project MUST use a TypeScript-based core library for the MVP because it suits class-based modeling, package composition, CLI tooling, and developer ergonomics.

The core library MUST support:

- code-defined metamodels;
- node and edge definitions rooted in a metamodel;
- runtime graph navigation and query resolution;
- inheritance for node types;
- package composition across modules;
- immutable exported model fragments;
- textual diagram export as a first-class output format.

The MVP MUST explicitly exclude advanced governance engines, external connector orchestration, and complex unresolved-reference management beyond minimal runtime handling. The product must remain focused on a practical core library and a first CLI workflow.

## Development Workflow

All work MUST begin with a clear specification and a bounded MVP scope. Production-quality model features MUST be developed in small, reviewable units with explicit package boundaries, tests, and export validation.

The project MUST follow this workflow:

1. Define the metamodel and package responsibility boundaries.
2. Add failing tests for model behavior, navigation, and immutability.
3. Implement the smallest library change that satisfies the contract.
4. Validate package composition and runtime graph behavior.
5. Export selected model fragments to a textual diagram or report artifact.
6. Review changes for governance, immutability, and reproducibility before merge.

Any feature that changes package semantics, export contracts, or graph behavior MUST include review and explicit validation evidence. The project MUST favor clear interfaces over hidden mutation and over-engineered abstractions.

## Governance

This Constitution supersedes informal practices and governs the design, review, and evolution of the System Model Forge project. All contributors MUST align work to these principles before merging changes that affect architecture, package boundaries, model semantics, or export behavior.

Amendments require documentation of the change, clear rationale, and a reviewed version bump. The project MUST maintain semantic versioning for the constitution and for public library interfaces: MAJOR for breaking governance or incompatible model semantics, MINOR for additive behavior or materially expanded guidance, and PATCH for clarifications and non-semantic refinements.

Compliance review includes checking that changes preserve immutability, validate deterministic builds, and remain within the approved MVP boundaries. Design decisions that expand scope beyond the core model library or add unsupported governance features MUST be explicitly documented and approved before implementation.

**Version**: 1.1.0 | **Ratified**: 2026-09-13 | **Last Amended**: 2026-09-13
