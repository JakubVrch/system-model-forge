# Feature Specification: Extensible Graph Core

**Feature Branch**: `001-governed-model-core`

**Created**: 2026-10-11

**Status**: Draft

**Input**: User description: "Split feature 001 to cover extensible node and edge classes, creating elements from them, exporting an array of instances as a diagram, using normal JavaScript array filtering, and traversing between linked nodes and edges. Separate partitions and other functions into different features."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Define and Create Graph Elements (Priority: P1)

A model author extends the core node and edge classes to define specialized elements, including elements that provide their own notation, and creates graph instances from those classes.

**Why this priority**: Extensible node and edge elements are the foundation for constructing and expressing a graph.

**Independent Test**: Define specialized node and edge classes, create instances from them, and verify each instance retains its specialized behavior and connected endpoints.

**Acceptance Scenarios**:

1. **Given** the core node and edge classes, **When** an author defines specialized classes, **Then** each specialized class can add its own behavior without changing the core classes.
2. **Given** specialized node and edge classes, **When** an author creates instances, **Then** the instances are usable as graph elements and each edge connects its two endpoint nodes.
3. **Given** specialized classes provide notation for their elements, **When** those instances are used in a diagram, **Then** their notation is available to the diagram output.

### User Story 2 - Traverse Connected Elements (Priority: P1)

A model author follows graph connections from a node to its incident edges and from an edge to its endpoint nodes.

**Why this priority**: Direct traversal makes the graph useful to callers without requiring them to manually search all elements for connections.

**Independent Test**: Create a graph with multiple nodes and edges, then verify the correct adjacent edges can be reached from each node and the correct endpoint nodes can be reached from each edge.

**Acceptance Scenarios**:

1. **Given** a node connected to one or more edges, **When** the author traverses from that node, **Then** all and only its incident edges are reachable.
2. **Given** an edge connecting two nodes, **When** the author traverses from that edge, **Then** both endpoint nodes are reachable.
3. **Given** a node with no incident edges, **When** the author traverses from that node, **Then** the result indicates that it has no linked edges without changing the graph.

### User Story 3 - Select and Export a Diagram (Priority: P2)

A model author selects graph elements from an array using ordinary JavaScript array filtering and passes an array of node and edge instances to a diagram export function.

**Why this priority**: Authors can work with familiar array operations and produce a readable diagram from exactly the elements they choose.

**Independent Test**: Filter a mixed array of graph instances with a standard array filter, export the resulting selection, and verify the diagram represents the selected elements and their connections.

**Acceptance Scenarios**:

1. **Given** an array containing different graph instances, **When** the author applies ordinary JavaScript array filtering, **Then** the matching instances can be selected without a separate built-in filtering capability.
2. **Given** an array of selected node and edge instances, **When** the author exports it as a diagram, **Then** the output represents each selected instance and uses its available notation.
3. **Given** the same selected instances and notation, **When** the author exports the diagram repeatedly, **Then** the result is consistent across exports.

### Edge Cases

- An empty instance array produces a valid empty diagram.
- A selected edge has an endpoint node that is not included in the export array; the diagram identifies the connection without adding an unselected node as though it were selected.
- Multiple edges connect the same pair of nodes; each edge remains separately traversable and represented.
- A graph contains a cycle; traversal and diagram export preserve the cycle without merging distinct elements.
- A node has no connected edges; traversal returns an empty set of linked edges.
- An edge is created with `undefined` for a node that does not exist (for example, during a bulk import where nodes arrive later or never); the edge is still created, is reachable from its defined endpoint, and exports without inventing the node.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide extensible core node and edge classes that authors can specialize without modifying the core classes.
- **FR-002**: The system MUST allow authors to create node and edge instances using the core classes or their specializations. Each edge has two endpoints, each a node instance or `undefined`; `undefined` is a valid value meaning the node is missing, so that incomplete bulk-imported data still produces a model.
- **FR-009**: Creating nodes and edges MUST NOT fail because of missing endpoint nodes or unconnected nodes. Traversal and diagram export MUST also succeed on such models; detecting and reporting these problems is left to a later validation feature.
- **FR-003**: Specialized node and edge classes MUST be able to provide notation for their instances, and diagram export MUST use that notation when available.
- **FR-004**: The system MUST provide a diagram export function that accepts an array of node and edge instances and returns a readable diagram representing the supplied selection.
- **FR-005**: Element selection MUST be possible using ordinary JavaScript array filtering; this feature MUST NOT require or introduce a separate built-in element-filtering operation.
- **FR-006**: Each node MUST expose an array of all edges connected to it, plus separate `outgoing` (node is the edge's `from`) and `incoming` (node is the edge's `to`) arrays so direction is explicit. Each edge MUST expose its `from` and `to` nodes. These MUST be references to the existing node and edge objects, and authors may filter the arrays with ordinary JavaScript array filtering.
- **FR-007**: Diagram export MUST handle empty selections, cycles, multiple edges between the same nodes, and edges whose endpoint nodes are not in the selection without inventing selected elements.
- **FR-008**: Repeated diagram exports of the same instances and notation MUST produce consistent output.

### Out of Scope

- Model partitions, partition composition, and dependency management.
- Dedicated element-filtering or query systems beyond ordinary JavaScript array filtering.
- Metamodel governance, cross-package assembly, and partition ownership or immutability rules.
- Model validation and debugging (reporting missing endpoints and similar problems) will be specified as a separate feature; this feature must only keep such problems representable.
- Additional model functions not required for node and edge specialization, creation, traversal, or diagram export.

### Key Entities *(include if feature involves data)*

- **Node**: A graph element that may be specialized and may be connected to edges.
- **Edge**: A graph element with two endpoints (each a node or `undefined` when missing) that may be specialized.
- **Graph Instance**: A created node or edge instance that can be traversed, selected, or exported.
- **Diagram**: A readable representation of a supplied array of graph instances, using notation provided by those instances when available.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Authors can complete all three primary workflows—specialize and create elements, traverse connections, and select and export a diagram—in the documented examples.
- **SC-002**: In the reference graph tests, 100% of node-to-edge and edge-to-endpoint traversal checks return the expected connected instances, including graphs with cycles and parallel edges.
- **SC-003**: For every tested export selection, the diagram represents 100% of selected instances and does not represent unselected endpoint nodes as selected.
- **SC-004**: Repeated exports of the same selection produce identical output in 100 consecutive runs.

## Assumptions

- A graph edge has two endpoints, normally nodes but possibly `undefined`; its endpoint ordering (`from` to `to`) may be used by its specialized notation or by caller filtering but does not limit traversal.
- A readable, deterministic textual diagram is sufficient for this feature; visual layout and image generation are not required.
- Authors provide any custom notation through their specialized node or edge classes; a documented default notation is used when a specialization does not provide one.
- The diagram represents the supplied array as the selection; callers use normal JavaScript array filtering when they need a subset.
- Partitioning and other independent model capabilities will be specified separately and are not prerequisites for this feature.
