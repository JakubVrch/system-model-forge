# Data Model: Reusable Diagram Export

## Value Conventions

- Elements remain ordinary model objects. Each model element has a unique `id` within the author's model when its notation needs a stable endpoint target.
- A node or edge defines its single output representation through its `toNotation()` method, not through a per-export formatter or global notation map.
- Diagram boundaries are plain strings supplied by the author and emitted exactly as provided.
- The selected output is deterministic for the same selection, title, and boundaries; authors keep control of element notation.
- A file destination is a path chosen by the author, and a failed write is an error state rather than a success result.

## Entities

| Entity | Fields and behavior | Rules |
| --- | --- | --- |
| `MetamodelType` | `name: string` | Names a node or edge type in the author's metamodel. The example defines a `service` node type and a relationship edge type. |
| `DiagramSelection` | `elements: readonly GraphElement[]` | Represents the exact subset chosen for export. The selection contains all model elements the author wants rendered, without inventing missing endpoints or new nodes. |
| `Node` | `id: string`, `name: string`, type metadata, `toNotation(): string` | A service node's unique ID is used by relationship notation as its endpoint target. Its C4 context notation is `System({id}, "{name}")`. |
| `Edge` | endpoint references, `name: string`, type metadata, `toNotation(): string` | A relationship owns its complete textual representation and derives target identifiers from its endpoint nodes. Its example notation is `Rel({from.id}, {to.id}, "{name}")`. |
| `DiagramBoundaries` | `startText: string`, `endText: string` | The start and end strings wrap the output exactly as supplied, even for empty selections. They are not hard-coded framework labels. |
| `ExportDestination` | `path: string`, `writeMode: 'overwrite'|'fail-on-exists'` (optional) | The destination identifies where the generated diagram text is saved. A write failure must be surfaced to the caller and must not be reported as success. |
| `Author-Written Export Function` | `exportModel(path: string): Promise<void> | void` | The author writes the function in the host language, loads the selected model, calls `exportDiagram()` and passes its returned text and the destination to `saveDiagram()`. |
| `DiagramDocument` | `content: string` | Final textual output that is saved to a file or printed to stdout. It is the deterministic result of the selection, notation, and boundaries. |

## Relationships and Lifecycle

1. The author selects a subset of model elements to export.
2. Each selected element's `toNotation()` method produces its single textual fragment.
3. The exporter groups rendered nodes before rendered edges, preserving their original order within each group.
4. The author's custom C4 context export function takes a title and supplies `C4Context` and `title {title}` as its beginning text. It supplies an empty ending string because this output has no closing row.
5. `exportDiagram()` returns the framed `DiagramDocument`; `saveDiagram(diagram, destination)` writes that already-generated text to the chosen file.
6. The author-written export function invokes this workflow through the host language CLI and checks the saved file content.

## Validation Rules

- Custom node and edge notation must not be prefixed with fixed `node:` or `edge:` labels.
- Nodes are always emitted before edges; the rule is strict and preserves supplied order within each group.
- Edge notation is responsible for endpoint output. Where it refers to a node, it can use that node's unique ID, including when that node is not selected.
- The author-provided start and end text frame is stable for empty selections and non-empty selections.
- Repeated exports of the same selection and configuration must generate identical byte-for-byte output.
- File writes are explicit: success is reported only when the path is actually written, and errors are surfaced to the caller.

## Out of Scope

This feature does not include a framework-owned diagram language, a dedicated export CLI program, or a general-purpose query engine. It does not define visual rendering, image generation, or rich layout. The library remains focused on deterministic textual output and author-controlled notation.
