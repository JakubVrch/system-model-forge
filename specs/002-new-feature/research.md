# Research: Reusable Diagram Export

## Custom notation without framework-defined labels

### Decision

Keep the exporter notation-agnostic. Every node and edge provides its one representation through `toNotation()`, and the exporter emits that text without fixed `node:` or `edge:` prefixes. There are no per-export formatter callbacks or built-in diagram-language registry.

### Rationale

The feature requirement explicitly says authors may use their own notation and that the framework should not force labels. A notation-agnostic export respects the constitution's Host-Language First rule: authors write ordinary TypeScript code that fits their model and tooling instead of learning a separate, framework-owned syntax.

### Alternatives considered

- A built-in `node:`/`edge:` prefix or per-export formatter registry would hide domain semantics behind framework defaults.
- A custom diagram DSL would add a second modeling language and require new tooling, documentation, and maintenance cost.
- Requiring a dedicated export command in the framework would duplicate the host language's natural CLI workflow and contradict the requirement for author-written export functions.

## Diagram boundaries and framing

### Decision

Allow authors to pass explicit start and finish text as direct `exportDiagram()` parameters and preserve those strings exactly. A Mermaid C4-specific wrapper can construct a multi-line header from its own inputs, such as the title in a C4 System Context, then pass the header and ending text to the core exporter.

### Rationale

The feature needs output that can be embedded in tool-specific text formats such as Mermaid C4 or a custom DSL. Fixed boundaries are the simplest way to support those integration styles without hard-coding one diagram language.

### Alternatives considered

- Hard-coded `diagram` and `end` wrappers would be rigid and would ignore author-specific diagram syntax.
- Implicit boundary insertion based on content type would create hidden behavior and make exports harder to test and reuse.

## Ordering and selection semantics

### Decision

When rendering a selection, emit all node representations first, in the original selection order, and then all edge representations in the original selection order. The exporter must preserve source order within each group and must not sort the output alphabetically or by type. Edge `toNotation()` implementations can use endpoint element IDs even when an endpoint node is omitted from the selection.

### Rationale

The requirements define an ordering rule that is stable and predictable for authors: node before edge, same-order within each group. This keeps deterministic results while still allowing an author to define natural source ordering for their model.

### Alternatives considered

- Sorting by string value would create nondeterministic behavior relative to author ordering and violates the requirement to preserve supplied order within each group.
- Interleaving node and edge output would make it harder to match selected model elements and tool-specific diagram layouts.

## File output and error handling

### Decision

Provide `saveDiagram(diagram, destination)`, which writes an already-generated diagram string to the author-selected path and rejects on filesystem failures.

### Rationale

The export feature's value is practical reuse: a generated diagram should be inspectable by humans and consumed by other tools. Explicit failure handling is necessary to satisfy the requirement that failed writes are not reported as successful exports.

### Alternatives considered

- Silent fallback to stdout or a default path would make generated artifacts unpredictable and would not satisfy author-controlled destinations.
- Uncaught filesystem errors would produce low-quality CLI behavior and fail the requirement for surfaced failures.

## CLI workflow for author-written export functions

### Decision

The framework does not provide a dedicated export CLI. Instead, the documented workflow is for the author to write a model-specific export function, run it through the host language's CLI (for example, Node.js), and point that function at an output file. The documentation will explain the call flow, not add a framework-owned command.

### Rationale

This matches the clarified requirement and the constitution's Host-Language First principle. The author remains in control of model loading, notation, output path, and file writing. It also keeps the project focused on the library and documentation rather than creating a separate CLI product area.

### Alternatives considered

- A built-in framework CLI would add product scope beyond the feature's requirement and would create maintenance burden for every author-specific model.
- A framework plugin architecture would be heavier than necessary for a small TypeScript library.

## Validation strategy

### Decision

Use the repository's existing TypeScript + Vitest workflow to validate deterministic export behavior, element-owned Mermaid C4 System Context notation, boundary text, ordering, and file writes. The integration fixture declares a service node type and a relationship edge type, creates two service elements with distinct IDs and names, and links them with a relationship named `REST`. An author-owned wrapper accepts the diagram title and provides the two-line Mermaid C4 header.

### Rationale

The project already standardizes on TypeScript and Vitest, and this feature is primarily about deterministic output and file generation. A few targeted tests and a documentation-based CLI check are enough to prove the behavior without adding new tooling.

### Alternatives considered

- A separate CLI harness or end-to-end framework would be overkill for a library feature with a documented runtime workflow.
- Manual spot checks alone would not provide repeatable validation evidence for the deterministic output contract.
