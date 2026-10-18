# Diagram Export Contract

The export function is author-controlled and notation-agnostic. It accepts a selected set of model elements and emits deterministic text framed by author-supplied boundaries. The example below uses Mermaid C4 System Context syntax.

```ts
export function exportDiagram(
  elements: readonly GraphElement[],
  startText: string,
  endText: string,
): string;

export async function saveDiagram(
  diagram: string,
  destination: string,
): Promise<void>;
```

## Contract semantics

- `startText` and `endText` are direct function parameters that wrap the exported document exactly as supplied by the author. They are not framework-defined labels.
- Each selected node or edge has one representation, returned by its `toNotation()` method. The exporter does not provide formatter callbacks or add element labels.
- Edge implementations use their endpoint references (and any author-defined endpoint identifiers) when constructing their own notation.
- The exporter emits all selected node fragments first, then all selected edge fragments, preserving original order within each group.
- A selected edge may include endpoint identifiers even when an endpoint node is omitted from the selection; the exporter does not invent or add nodes.
- The exporter separates the start, element, and end sections with newlines and appends a final newline. An empty selection contains only the start and end sections.
- `saveDiagram()` accepts the text returned by `exportDiagram()` and writes it to `destination`. It rejects with the filesystem error if the path cannot be created or written.

## File-safety requirements

The file-saving path is not implicit. It must be selected by the author and checked by the host program. A write failure must be surfaced as an error and never reported as a successful export.

## Example output

```text
C4Context
title System Context diagram
System(SystemA, "System A")
System(SystemB, "System B")
Rel(SystemA, SystemB, "REST")
```

The author-owned context export function accepts the title and passes
`C4Context\ntitle ${title}` as the start text to `exportDiagram()`. The two
service nodes provide `System(${id}, "${name}")` through `toNotation()`;
the relationship provides `Rel(${from.id}, ${to.id}, "${name}")`. Thus the
function supplies the first two rows while element notation supplies the
remaining rows. No framework labels are added.
