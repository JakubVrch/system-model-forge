# Implementation Plan: Reusable Diagram Export

**Branch**: `002-new-feature` | **Date**: 2026-10-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification for author-controlled diagram export, custom notation, boundary text, ordering, file writes, and a CLI-based validation workflow.

## Summary

Implement a small TypeScript improvement to the diagram exporter so it frames the single `toNotation()` result owned by each node and edge, uses explicit start and finish text, emits nodes before edges while preserving source order within each group, and saves already-rendered diagram text to a chosen file. The integration fixture defines a service node type and a relationship edge type and exports two uniquely identified service nodes and a named relationship in Mermaid C4 System Context syntax. An author-owned wrapper accepts the title and supplies the two-line header. The feature remains focused on the core library and documentation for author-written CLI invocation; it does not introduce a framework-owned export CLI or a separate diagram-language registry.

## Technical Context

**Language/Version**: TypeScript on Node.js 24 LTS (repository baseline)

**Primary Dependencies**: TypeScript, Vitest, and Node.js standard library file APIs

**Storage**: N/A for model state; file output is author-selected and written to the local filesystem when export is saved

**Testing**: Vitest unit and integration tests, plus a documented CLI validation workflow using the host language runtime

**Target Platform**: Node.js 24 LTS on local developer and CI hosts

**Project Type**: TypeScript library with author-written CLI usage examples and file-generation support

**Performance Goals**: Generate deterministic text output and write a diagram file in under 5 seconds in the documented development environment for small model selections

**Constraints**: Deterministic node-before-edge ordering with within-group source order, element-owned notation, exact boundary text preservation, saving pre-rendered text with explicit filesystem error handling, and no framework-provided export CLI program

**Scale/Scope**: A bounded feature for exporting selected nodes and edges from a model with author-defined notation and file persistence; no visual layout, export engine plugin system, or extra governance tooling

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Pre-design gate: PASS**

- **Model-as-Source**: the model remains source-defined TypeScript objects and the export is derived text, not the authoritative model state.
- **Graph-First Architecture**: the output still represents nodes and edges as first-class graph elements and keeps endpoint semantics visible to author-defined notation.
- **Composable, Package-Bounded Design**: the change is limited to export formatting and file output in the existing core library package and does not add separate model packages.
- **Immutability of Shared Exports**: export reads do not mutate the model; element `toNotation()` methods emit text without altering model state.
- **Deterministic, Validateable Builds**: the export contract requires byte-identical output for the same selection and notation.
- **Host-Language First**: the feature uses ordinary TypeScript methods, native arrays, and native file writing rather than inventing a custom export language or command framework.
- **Additional constraints**: the scope stays within the TypeScript core library and authored CLI workflow; no advanced governance engine or large DSL is introduced.

**Post-design gate: PASS**

The planned change uses each element's `toNotation()` method, direct boundary parameters, and Node.js file APIs within the existing TypeScript library. It preserves graph-first semantics and deterministic ordering. No additional constitutional violation is introduced, and no broader project scope is required beyond the core library plus documentation of the CLI workflow.

## Project Structure

### Documentation (this feature)

```text
specs/002-new-feature/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── diagram-export-contract.md
└── tasks.md              # Phase 2 output; not created by /speckit-plan
```

### Source Code (repository root)

```text
src/
├── element/
│   ├── adjacency.ts
│   ├── edge.ts
│   ├── model-element.ts
│   └── node.ts
├── export/
│   └── export-diagram.ts
├── index.ts
└── README extension points (no new package)

tests/
├── integration/
│   └── quickstart.test.ts
├── type/
│   └── declarations.test-d.ts
└── unit/
    ├── export-diagram.test.ts
    ├── traversal.test.ts
    └── smoke.test.ts
```

**Structure Decision**: Keep the feature within the existing single-package TypeScript library. The design adds direct start/end boundary parameters and text-file output at the root export module and validates through the current unit, integration, and type-test layout. No new workspace or CLI package is introduced.

## Complexity Tracking

No constitutional violations require justification.
