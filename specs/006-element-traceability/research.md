# Research: Element Traceability

## Required core names

**Decision**. Add readonly string `name` to `ModelElement` and append the required value to the existing node and edge constructor arguments. Existing named classes forward their authored names to the base class. Callers that currently supply only IDs add explicit names. Keep typed edge endpoints and `defineElement` constructor inference.

**Rationale**. Required metadata belongs to the same element contract as the ID. Appending the argument preserves the order of existing parameters and keeps migration mechanical. TypeScript declarations enforce the new contract, and the CLI validates names from evaluated model sources because its loader can run sources without a typecheck.

**Alternatives considered**. Deriving a default from the ID or model type would hide missing authorship. Continuing to derive the name from `getElementInfo()` would let projection or custom attributes change the displayed identity.

## Listing and projection

**Decision**. Reserve `id` and `name` as identity metadata. The default attribute snapshot excludes both, and listing omits those keys from custom attribute records. Projection applies to business attributes. Treat `label` like any other authored business attribute. Migrate fixture display labels to the core name.

**Rationale**. One source for each identity field avoids conflicting values. A projection controls the business attributes and always includes element identity.

**Alternatives considered**. Including identity in the attribute record would duplicate fields and leave room for overrides to provide conflicting values.

## Root lookup and traversal

**Decision**. Reuse the child source loader, partition selector, and union of published element and diagram memberships. Resolve exact-ID matches and deduplicate by object identity. Distinct objects sharing the requested ID each produce a root. Walk the loaded objects through core adjacency in the same child process and send only the normalized result trees to the parent. Share the existing CLI type detection and use the existing unknown-type treatment.

**Rationale**. The child already holds the graph, including imported endpoints. Only the starting lookup uses publication membership. Object identity preserves parallel edges and distinct objects with equal IDs. Tracking the current path stops backtracking and cycle expansion while independent branches retain shared neighbors.

**Alternatives considered**. A new graph index or a graph reconstructed from serialized exports could lose connections outside the selected memberships and would duplicate existing core navigation.

## Command and rendering

**Decision**. Extend the existing strict argument, help, result, and IPC paths with `trace-element`. Route help and version through standalone commands that bypass model discovery. Format the same normalized result as a terminal tree or JSON. Escape authored control characters in pretty output using the existing output helper. Apply the same applicability checks to unknown and command-specific options so `--property` fails for trace.

**Rationale**. Reusing command infrastructure preserves selector semantics, source-log isolation, and the existing error behavior. A shared tree representation makes parity and ordering testable.

**Alternatives considered**. A separate executable or independent JSON traversal would duplicate loading and selection or risk different trees across formats.

## Integration fixtures

**Decision**. Extend the existing `tests/integration/fixtures/microservice-environment` source model and run the built CLI through the integration test helpers. Keep its existing partition IDs, element IDs, and connections. Add only the fixture variants needed to exercise behavior not present in that graph.

**Rationale**. Service A already provides named nodes, parallel event-flow edges to the shared topic, diagram and element publication, and references outside a narrowed selection. Service B shares that topic and supplies a deeper traversal. The fixture already supports partition, diagram, and CLI regression tests.

**Alternatives considered**. Creating a separate reference model for traceability would skip the requested service environment and duplicate graph setup.
