# Feature Specification: Model Queries and Selection Cleanup

**Feature Branch**: No feature branch created; current branch is `main`.

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "Efficiently query a model and expand the quickstart into a holistic microservice integration example: shared topics and databases, two independently exported services with modules and relationships, and service event overviews derived by selecting services, following filtered outgoing relationships, merging reached topics with service exports, and removing relationships whose targets are absent. Research reusable utilities needed in the main package."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discover Connected Nodes (Priority: P1)

A model author selects starting nodes from an exported collection, then supplies an edge filter that determines which outgoing edges to jump across. The filter evaluates each outgoing edge (for example, its type or properties) before traversal. Only accepted edges are followed to their target nodes; rejected edges are not followed. This discovers connected nodes without maintaining a separate target list.

**Why this priority**: Edge-driven discovery keeps selections aligned with the model and removes repeated traversal logic across domains.

**Independent Test**: Give a node outgoing edges of two different types to three target nodes of the same type. Supply an edge filter accepting only one edge type and verify that only targets connected by accepted edges are reached. This proves that traversal filters edges, not just target nodes.

**Acceptance Scenarios**:

1. **Given** selected starting nodes with outgoing edges of different types or property values, **When** the author supplies an edge predicate, **Then** each outgoing edge is evaluated before the hop, only accepted edges are followed, and only their defined target nodes are returned. A node connected only by rejected edges is excluded even if it has the same type and properties as an included target.
2. **Given** several matching edges reach one node, **When** targets are collected, **Then** that node occurs once, preserving original identity and first-discovery order.
3. **Given** a reached node has further connections, **When** the query runs, **Then** it stops after one outgoing hop and does not follow those further connections.
4. **Given** no selected nodes or matching edges, **When** the query runs, **Then** the result is empty and the model is unchanged.

### User Story 2 - Produce a Self-Contained Selection (Priority: P1)

A model author merges an exported selection with discovered nodes and removes edges that cannot be represented wholly within the resulting selection.

**Why this priority**: Derived selections must accurately represent their scope without dangling edges or unintended nodes.

**Independent Test**: Clean a selection containing nodes and edges to included and excluded endpoints; verify exact retained elements.

**Acceptance Scenarios**:

1. **Given** an exported selection of nodes and edges, **When** discovered nodes are merged and incomplete edges removed, **Then** all selected nodes and every edge with both endpoints included remain, and edges to omitted nodes are excluded.
2. **Given** an edge with an undefined endpoint or an endpoint outside the selection, **When** cleanup runs, **Then** that edge is removed without adding endpoints or removing selected nodes.
3. **Given** distinct parallel edges or a self-loop with selected endpoints, **When** cleanup runs, **Then** those edges remain in their original order.
4. **Given** unchanged inputs, **When** the selection is computed and exported 100 times, **Then** its elements and diagram text are identical and source collections and adjacency remain unchanged.

### User Story 3 - Query a Model Organized into Infrastructure and Services (Priority: P2)

A framework consumer runs a microservice environment model organized into separate folders. Infrastructure folders publish shared nodes, and each service folder publishes its own model elements and a derived service event overview. These domain-specific types belong to the test case; the query operations work with generic nodes and edges.

**Model layout and exports**:

```text
microservice-environment/
├── infrastructure/
│   ├── topics/        # Exports event topic nodes and an array of all topics
│   └── databases/     # Exports database nodes and an array of all databases
├── service-a/         # Exports service A, its modules, relationships, and overview
└── service-b/         # Exports service B, its modules, relationships, and overview
```

- The topics folder owns shared event topic nodes and exports an array containing all of them. Include a topic used by both services, a topic used only by each service, and an unrelated topic.
- The databases folder owns database nodes and exports an array containing all of them. Each service connects to at least one database from this collection.
- Each service folder imports the existing infrastructure nodes and exports its service node, a collection of the modules it is built from, and edges connecting the service to those modules and to selected topics and databases.
- Each service folder also exports a complete local model array containing its service node, modules, and all those edges. Referenced infrastructure nodes remain in their infrastructure collections; they are not automatically added to this local array.
- Each service folder additionally exports a **service event overview diagram array**, derived from its local model array using the four steps below. It contains the original service node and modules, discovered topic nodes, and the retained original edges.

**Overview derivation within each service folder**:

1. Select service nodes from the exported local model array using ordinary array filtering.
2. For each selected service node, follow outgoing edges accepted by an event-edge predicate to discover topic nodes. The predicate filters the edges to jump across; database and module edges are not followed in this step. Do not maintain a separate overview topic list.
3. Merge the discovered topic nodes with the complete local model array, which already contains the service node, modules, and all module, event, and database edges. Preserve original element identities and include each reference once.
4. Apply the general selection-cleanup operation to remove edges whose endpoints are not both in the merged array. Database edges are removed because database nodes were not added; module and event edges remain because their endpoints are included.

The integration test imports the arrays exported by both service folders and verifies them as the output of this pipeline, then renders and saves them through the existing diagram export facilities.

**Why this priority**: The folder structure demonstrates how independently authored model fragments reuse shared infrastructure, while the derived arrays exercise selection, edge-filtered traversal, merging, cleanup, and diagram export together.

**Independent Test**: Load the topics and databases collections and both service folders' exports. Compare each exported overview with explicit expected nodes and edges, then verify its rendered and saved diagram text.

**Acceptance Scenarios**:

1. **Given** separate topics and databases folders exporting their full node arrays, **When** both service folders construct their relationships, **Then** their edges reference the original exported infrastructure nodes rather than copies.
2. **Given** each service folder exports its service node, module collection, and local array of service, modules, and all relationships, **When** its event overview is derived, **Then** starting service nodes are selected from that local array and topics are discovered by following only predicate-accepted outgoing event edges.
3. **Given** a shared topic and a topic specific to each service, **When** both overview arrays are inspected, **Then** each contains its own service and modules and the relevant original topic nodes, while excluding the other service, the other service's modules, unrelated topics, and all database nodes.
4. **Given** a local array includes module, event, and database edges, **When** reached topics are merged and the general cleanup operation runs, **Then** module and event edges remain and database edges are removed, without changing the original local array or infrastructure collections.
5. **Given** a topic referenced by a qualifying event edge, **When** an overview is derived, **Then** the topic is discovered from that edge without a separately maintained overview topic list.
6. **Given** both service folders export their derived overview arrays, **When** the integration test renders and saves each array, **Then** exact membership and diagram contents match independently specified expectations.

### Edge Cases

- Empty selections, isolated nodes, and predicates rejecting every edge produce no reached nodes.
- Undefined targets are skipped during traversal; edges with either undefined endpoint are removed during cleanup.
- Incoming-only edges are not followed; cycles do not cause recursive traversal.
- Repeated references to one node produce one discovered node; distinct nodes with equal display labels remain distinct.
- Parallel edges remain distinct even when their target is deduplicated.
- A matching self-loop returns its node once and survives cleanup if that node is selected.
- A discovered node already present in the original selection occurs once in the merged selection.
- Cleanup preserves selected isolated nodes and never adds missing endpoints.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Authors MUST be able to select nodes from mixed node/edge collections using existing host-language selection facilities and author-defined criteria.
- **FR-002**: The framework MUST provide reusable one-hop outgoing traversal accepting an author-defined predicate over edges. The predicate MUST receive the outgoing edge so the author can filter by its type, properties, or endpoints. Traversal MUST evaluate the predicate before following that edge, jump only across accepted edges, and return their defined target nodes. Edge filtering MUST be independent of starting-node selection and MUST NOT be replaced by filtering target nodes after traversal. The operation MUST be independent of domain-specific node or edge types.
- **FR-003**: Reached nodes MUST preserve source identity, omit duplicate references, and retain first-discovery order according to selected node order and outgoing edge order.
- **FR-004**: The framework MUST provide reusable selection cleanup retaining nodes and retaining an edge only when both endpoints are defined and present by identity. Cleanup MUST preserve retained input order and distinct parallel edges.
- **FR-005**: Querying, merging, cleaning, and exporting MUST leave source elements, exported collections, and adjacency unchanged.
- **FR-006**: The integration example MUST compose independently exported node/edge collections, including edges to shared nodes, while preserving original element identities.
- **FR-007**: Authors MUST be able to derive a selection by selecting starting nodes, following qualifying outgoing edges, merging reached nodes with an existing node/edge collection, and removing edges with endpoints outside the result. Each element reference MUST occur once in the merged selection.
- **FR-008**: The integration example MUST include nodes reached from multiple starting nodes, nodes reached from only one starting node, and unrelated nodes to make inclusion and exclusion verifiable. Story 3 defines the concrete microservice test case.
- **FR-009**: Integration coverage MUST assert exact derived selection membership, retained and excluded edges, shared source identities, independently specified expected diagram contents for each example selection, saved contents, and repeated-export stability.
- **FR-010**: Automated coverage MUST verify empty results, undefined endpoints, incoming-only edges, parallel edges, self-loops, repeated references, equal-label distinct nodes, and source collection and adjacency preservation.
- **FR-011**: Traversal MUST inspect only selected nodes' outgoing edges; disconnected elements MUST NOT increase predicate evaluations. Cleanup MUST support work proportional to selection size rather than repeatedly searching the full model for each edge.
- **FR-012**: Existing direct traversal and export behavior MUST remain available. Cleanup MUST be explicitly requested rather than silently applied to all exports.

### Key Entities *(include if feature involves data)*

- **Node**: A graph element that can be selected, used as a traversal starting point, or reached as an edge target; domain-specific node types remain author-defined.
- **Edge**: A directed connection between nodes with author-defined meaning and potentially undefined endpoints.
- **Edge Predicate**: An author-defined filter evaluated on an outgoing edge before traversal; acceptance permits a hop across that edge, and rejection prevents it.
- **Selection**: An ordered collection of existing nodes and edges retaining source identity.
- **Derived Selection**: A selection formed by merging existing elements with reached nodes and removing edges whose endpoints are not both included.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Each reference selection contains 100% of expected nodes and edges and zero unintended elements.
- **SC-002**: Every retained edge has both endpoints included; all input edges with included endpoints remain and all input edges with undefined or omitted endpoints are excluded.
- **SC-003**: Target nodes are derived entirely from matching edges, with zero separately maintained target-node lists for derived selections.
- **SC-004**: Across 100 repeated runs, each derived selection exports byte-identical text and leaves source collections and adjacency unchanged.
- **SC-005**: Adding disconnected nodes and edges produces zero additional edge predicate evaluations for an unchanged query.
- **SC-006**: The executable example covers all four query stages, two independently derived selections, and diagram persistence with explicit expected outcomes, so consumers can reproduce the workflow without inventing traversal or cleanup logic.

## Assumptions

- The example extends `tests/integration/quickstart.test.ts`; reusable utilities belong in the main package under `src/`. Exact public names and signatures are planning decisions.
- Service, module, topic, and database types belong only to the integration test case; framework operations use generic nodes and edges.
- Separate folders and ordinary module exports suffice; governed partitions are not a prerequisite.
- In the integration test case only, event relationships are directed from services to topics, including subscriptions in this example; author-defined meaning distinguishes event, database, and module interactions.
- In the integration test case only, the starting service export includes its service node, modules, and relationships. Topics are discovered; databases are not merged.
- Cleanup requires both endpoints, generalizing the requested target exclusion to any self-contained selection.
- Identity means the same in-memory element, not equal identifiers or display labels.
- Efficiency means local traversal and proportional selection processing; no arbitrary elapsed-time threshold is imposed.
- Multi-hop search, a query language, graph storage, runtime partition governance, and automatic global discovery are out of scope.
