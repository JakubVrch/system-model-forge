# Feature Specification: Reusable Diagram Export

**Feature Branch**: `002-new-feature`

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "Improve diagram export so authors can use their own notation instead of fixed `node:` and `edge:` labels, specify diagram start and finish text, emit nodes before edges, save the result to a specified file, and invoke export through the CLI to check a model during creation."

## Clarifications

### Session 2026-10-18

- Q: How should the CLI obtain the custom notation for an export? → A: The author writes an export function that exports the model to a file and invokes that function through the CLI; documentation is sufficient, and a dedicated CLI program is not required.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Export with Custom Notation (Priority: P1)

A model author exports a selection of nodes and edges using notation appropriate to a textual diagram tool. The author controls how each node and edge is represented, as well as the text that starts and finishes the diagram, without being forced to include framework-defined labels.

**Why this priority**: Reusable, notation-independent export is the core capability; it lets authors produce diagrams useful to their own modeling tools.

**Independent Test**: Export a selection with custom node and edge representations and custom boundary text, then verify that the result contains exactly those representations and boundaries.

**Acceptance Scenarios**:

1. **Given** a selection containing nodes and edges and author-defined notation, **When** the author exports it, **Then** the output uses the supplied node and edge representations without adding fixed `node:` or `edge:` labels.
2. **Given** an author-defined notation used for one export, **When** the author reuses it to export a different selection, **Then** the same notation rules apply without redefining them.
3. **Given** custom diagram start and finish text, **When** the author exports a selection, **Then** the output begins and ends with the exact supplied text.
4. **Given** a selection containing nodes and edges, **When** the author exports it, **Then** all node representations appear before any edge representations, while preserving the input order within each group.
5. **Given** an empty selection, **When** the author exports it, **Then** the output still contains the supplied diagram start and finish text and no element representations.
6. **Given** the same selection and notation, **When** the author exports it repeatedly, **Then** every result is identical.

---

### User Story 2 - Save an Export to a File (Priority: P2)

A model author writes the generated textual diagram to a chosen file so it can be inspected or used by another tool.

**Why this priority**: Saving the output makes exports practical as repeatable model artifacts in addition to transient text.

**Independent Test**: Export a known selection to a chosen destination and compare the file contents with the generated diagram text.

**Acceptance Scenarios**:

1. **Given** a valid destination and a successful export, **When** the author saves the result, **Then** the destination file contains the complete diagram text.
2. **Given** a destination that cannot be written, **When** the author saves the result, **Then** the operation reports a failure and does not indicate that the diagram was saved.

---

### User Story 3 - Export a Diagram from the CLI (Priority: P3)

A model author writes a function that loads their model, applies their custom export notation, and saves the diagram to a file. They invoke that function through the host language's CLI to check the model during development. Documentation explains this workflow; the framework does not need to provide a dedicated export CLI program.

**Why this priority**: A repeatable command-line invocation lets authors check exported output during model creation.

**Independent Test**: Follow the documented workflow to invoke an author-written export function through the host language's CLI and verify that it writes the expected diagram to the chosen file.

**Acceptance Scenarios**:

1. **Given** an author-written function that loads a model and exports it using custom notation, **When** the author invokes that function through the documented CLI workflow, **Then** the function runs without requiring a framework-provided export CLI program.
2. **Given** an author-written export function configured to save to a chosen file, **When** the author invokes it through the CLI, **Then** the diagram is written to that file.
3. **Given** the author-written export function cannot load its model or write its destination, **When** the author invokes it through the CLI, **Then** the failure is surfaced and the invocation does not report a successful export.

### Edge Cases

- An empty model produces only the configured diagram start and finish text.
- A model contains edges whose endpoint nodes are missing or are not selected; export does not invent node representations and the edge notation can represent a missing endpoint.
- A model has no nodes, no edges, or only one of those element types; the available elements are still emitted in the required order.
- A custom node or edge representation is empty; it is emitted as supplied and does not cause default labels to be added.
- The requested output destination cannot be created or written; the user receives an explicit failure.
- The author-written export function cannot load its model or write its destination; the CLI invocation surfaces the failure rather than reporting a successful export.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST let authors define and reuse notation for representing nodes and edges, without requiring framework-defined `node:` or `edge:` labels.
- **FR-002**: The system MUST let authors specify the textual content that begins and ends an exported diagram.
- **FR-003**: The system MUST emit all selected node representations before all selected edge representations, preserving the supplied order among nodes and among edges.
- **FR-004**: The system MUST expose enough information about an edge's endpoints for the supplied edge notation to represent them, including when an endpoint is missing or not selected.
- **FR-005**: The system MUST generate an empty diagram using the configured start and finish text when the selection contains no elements.
- **FR-006**: The system MUST provide a way to save generated diagram text to an author-specified file and MUST report file creation or write failures explicitly.
- **FR-007**: The system MUST document how authors can invoke their own export function through the host language's command-line workflow; it MUST NOT require a framework-provided export CLI program.
- **FR-008**: An author-written export function MUST be able to use the system's file-saving capability to write the generated diagram to an author-specified destination.
- **FR-009**: The documented command-line workflow MUST surface failures from the author-written export function instead of reporting a successful export.
- **FR-010**: Repeated exports of the same model selection and notation MUST produce identical text.

### Key Entities

- **Diagram Selection**: The nodes and edges chosen by an author for a particular export.
- **Notation**: Author-provided rules for representing selected nodes, edges, and edge endpoints as text.
- **Diagram Boundaries**: Author-provided starting and ending text that frames a diagram.
- **Export Destination**: A user-selected file where the author-written export function saves the generated diagram.
- **Author-Written Export Function**: User-authored code that loads a model, applies its chosen notation, and saves the generated diagram.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In all conformance examples, custom node and edge notation and custom diagram boundaries appear exactly as supplied, with no unrequested fixed element labels.
- **SC-002**: In all conformance examples containing both element types, 100% of node representations precede every edge representation.
- **SC-003**: For every tested file export, the saved file contents exactly match the generated diagram text.
- **SC-004**: Authors can follow the documented workflow to run their own export function through the host language's CLI and inspect the generated file in under 5 seconds on the documented development environment.
- **SC-005**: Repeating an export 100 times with the same model selection and notation produces identical text on every run.

## Assumptions

- Authors supply notation rules for nodes, edges, and any endpoint details; the export capability does not prescribe a textual diagram language.
- Authors are responsible for writing and invoking their model-specific export function; documentation of the host language's CLI workflow is sufficient, and a dedicated framework export command is not required.
- The author-written export function chooses and writes the output destination using the system's file-saving capability.
- Export order is stable: source order is preserved within the node group and within the edge group, while nodes are always emitted first.
- This feature produces textual diagrams only; visual layout and image rendering are not required.
