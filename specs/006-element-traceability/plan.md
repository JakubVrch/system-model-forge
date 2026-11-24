# Implementation Plan: Element Traceability

**Branch**: `006-element-traceability` | **Date**: 2026-11-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/006-element-traceability/spec.md`

## Summary

Require an authored, readonly name on every core node and edge. Migrate core subclasses, model construction, documentation, and fixtures. Use the canonical name in CLI element listings, endpoint summaries, and the new `trace-element <element-id>` command. Validate the built CLI with the existing microservice environment model.

## Technical Context

**Language/Version**: TypeScript 5.8 and Node.js 24 or later.

**Primary Dependencies**: Existing core graph and partition API, Node argument parsing and process IPC, tsx source loading, and Vitest.

**Storage**: In-memory graph and transient result trees. Sources are loaded through existing partition discovery.

**Testing**: Core runtime and declaration checks, focused CLI unit checks, and built-CLI integration over `tests/integration/fixtures/microservice-environment`. Migrate the existing CLI-specific fixtures alongside the service environment. Aim for 85% combined unit and integration coverage using the existing coverage command. Keep integration focused on the main CLI flows and cover edge cases in focused unit tests.

**Target Platform**: Existing Node CLI targets.

**Project Type**: One TypeScript package exposing a library and CLI.

**Performance Goals**: Scan selected export memberships once for root lookup and expand adjacency only along displayed paths within the hop limit. Cost depends on visited paths and output size because independent paths can repeat an element.

**Constraints**: Preserve object identity, existing graph adjacency and partition boundaries, deterministic output, and the isolation of source output from result stdout. Keep the existing CLI source-loading and path-selector behavior. Required constructor arguments are a breaking public core change under the constitution's versioning policy.

**Scale/Scope**: Name migration throughout core and its callers, one CLI command, listing identity changes, schema documentation, and validation of the same graph in pretty and JSON output.

## Constitution Check

| Principle | Before research | After design |
| --- | --- | --- |
| Model-as-Source | Pass. Names are authored in model definitions. | Pass. The migration supplies names at construction sites and retains existing declarations and source ownership. |
| Graph-First Architecture | Pass. Trace uses existing graph links. | Pass. Runtime adjacency and object identity preserve direction, cycles, and distinct parallel edges. |
| Composable, Package-Bounded Design | Pass. Partitions remain the source of root lookup. | Pass. Existing discovery and ordinary imports determine the loaded graph. The CLI walks that graph in the existing child process. |
| Immutability of Shared Exports | Pass. Names are readonly and trace reads the graph. | Pass. Preserve existing freezing and export guards. Traverse without modifying graph objects or publication sets. |
| Deterministic, Validateable Builds | Pass. Tree ordering and hop limits are specified. | Pass. Sort by ordinal model type and direction with authored order for ties. Validate repeated output, fixture relationships, and build regression cases. |
| Host-Language First | Pass. Use the current TypeScript and Node stack. | Pass. Use existing TypeScript constructor inference, Node argument parsing, tsx loading, and the test harness. |

Follow the constitution's test-first workflow for model identity, navigation, and publication. The public core constructor change requires major-version treatment on release. This plan records the compatibility impact and leaves release execution outside feature design.

## Project Structure

### Documentation (this feature)

- `plan.md`
- `research.md`
- `data-model.md`
- `contracts/core-name.md`
- `contracts/cli-trace.md`
- `quickstart.md`

### Source Code (repository root)

| Area | Planned changes |
| --- | --- |
| `src/core/element/` | Add canonical names to the model contract, constructors, and attribute snapshot. Preserve endpoint typing and adjacency. |
| `src/cli/arguments/`, `src/cli/main.ts` | Register trace, help, and version as commands. Parse the trace ID and depth and report unsupported options through the normal error path. |
| `src/cli/source/`, `src/cli/commands/` | Run root lookup and traversal in the source child. Share identity and type extraction with listing. Extend result routing and IPC validation. |
| `src/cli/result.ts`, `src/cli/output/` | Carry required names and ordered trace data, render the terminal tree, and document the JSON fields. |
| `tests/unit/`, `tests/type/` | Migrate constructor calls and assertions. Cover required names, CLI parsing, deterministic traversal, and presentation. |
| `tests/integration/` | Use the existing built-CLI harness and service environment fixtures for trace and name checks. Migrate other fixtures supporting existing regression tests. Move fixture display labels into core names. In the service environment, migrate `ModuleComposition` and `DatabaseUsage` and use their names in the same diagram text. |
| `README.md` | Update constructor examples, migration guidance, command options, and JSON contract notes. |

**Structure Decision**. Keep the canonical field in core and the trace result in the CLI. Use the existing source child for graph operations and send only data needed to render the result.

## Phase 0: Research

[Research decisions](research.md) resolve constructor migration, CLI projection, graph traversal, output compatibility, and fixture coverage.

## Phase 1: Design and Validation

| Requirements | Validation evidence |
| --- | --- |
| FR-001–003, FR-010, FR-014 | Focused parser and lookup unit tests cover standalone help and version, argument errors, unknown IDs and multiple matching roots, and unsupported `--property`. A scoped service trace exercises shared selection in the built CLI. |
| FR-004–009 | Service fixture integration covers the default Service A tree with parallel edges and imported endpoints, a depth-two JSON trace of the shared topic, and canonical names in listing. Focused unit cases cover edge roots, format parity, deterministic order, self-loops, missing endpoints, and cycles. |
| FR-011–013 | Core declaration checks, immutable publication regression tests, canonical names in listing and endpoints, generic treatment of custom attributes, migration of fixtures and examples, and build/inventory regressions. |
| SC-001–005 | [Quickstart validation](quickstart.md) gives the runnable service fixture commands and expected outcomes. |

See the [data model](data-model.md), [core name contract](contracts/core-name.md), and [CLI contract](contracts/cli-trace.md).
