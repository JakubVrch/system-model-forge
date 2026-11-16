# Feature Specification: Model Queries and Selection Cleanup

**Feature Branch**: `003-query-model-overviews`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "Efficiently query a model and expand the quickstart into a holistic microservice integration example: shared topics and databases, two independently exported services with modules and relationships, and service event overviews derived by selecting services, following filtered outgoing relationships, merging reached topics with service exports, and removing relationships whose targets are absent. Research reusable utilities needed in the main package."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discover Connected Nodes (Priority: P1)

A model author selects starting nodes from an exported collection, chooses outgoing, incoming, or both directions, and supplies an edge filter. The filter evaluates each edge in the chosen direction (for example, its type or properties) before traversal. Only accepted edges are followed to the opposite endpoint relative to the starting node; rejected edges are not followed. This discovers connected nodes without maintaining a separate target list.

**Why this priority**: Edge-driven discovery keeps selections aligned with the model and removes repeated traversal logic across domains.

**Independent Test**: Give a node outgoing edges of two different types to three target nodes of the same type. Supply an edge filter accepting only one edge type and verify that only targets connected by accepted edges are reached. This proves that traversal filters edges, not just target nodes.

**Acceptance Scenarios**:

1. **Given** selected starting nodes with outgoing edges of different types or property values, **When** the author supplies an edge predicate, **Then** each outgoing edge is evaluated before the hop, only accepted edges are followed, and only their defined target nodes are returned. A node connected only by rejected edges is excluded even if it has the same type and properties as an included target.
2. **Given** several matching edges reach one node, **When** targets are collected, **Then** that node occurs once, preserving original identity and first-discovery order.
3. **Given** a reached node has further connections, **When** the query runs, **Then** it stops after one hop in the selected direction and does not follow those further connections.
4. **Given** no selected nodes or matching edges, **When** the query runs, **Then** the result is empty and the model is unchanged.
5. **Given** a start with incoming and outgoing edges, **When** incoming traversal is selected, **Then** only accepted incoming edges are followed to their defined source nodes.
6. **Given** a start with interleaved incoming and outgoing edges and a self-loop, **When** both-direction traversal is selected, **Then** accepted incident edges reach the opposite endpoints in incident registration order, and the self-loop is evaluated once for that start.
7. **Given** an edge between two distinct selected starts, **When** both-direction traversal runs, **Then** the predicate evaluates that edge once per start and both endpoints may be reached, with identity-based result deduplication.

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
- Each service folder also exports a complete local model set containing its service node, modules, and all those edges. Referenced infrastructure nodes remain in their infrastructure collections; they are not automatically added to this local set.
- Each service folder additionally exports a **service event overview diagram set**, derived from its local model array using the four steps below. It contains the original service node and modules, discovered topic nodes, and the retained original edges.

**Overview derivation within each service folder**:

1. Select service nodes from the exported local model array using ordinary array filtering.
2. For each selected service node, follow outgoing edges accepted by an event-edge predicate to discover topic nodes. The predicate filters the edges to jump across; database and module edges are not followed in this step. Do not maintain a separate overview topic list.
3. Merge the discovered topic nodes with the complete local model set, which already contains the service node, modules, and all module, event, and database edges. Preserve original element identities and include each reference once.
4. Apply the general selection-cleanup operation to remove edges whose endpoints are not both in the merged array. Database edges are removed because database nodes were not added; module and event edges remain because their endpoints are included.

The integration test imports the arrays exported by both service folders and verifies them as the output of this pipeline, then renders and saves them through the existing diagram export facilities.

**Why this priority**: The folder structure demonstrates how independently authored model fragments reuse shared infrastructure, while the derived arrays exercise selection, edge-filtered traversal, merging, cleanup, and diagram export together.

**Independent Test**: Load the topics and databases collections and both service folders' exports. Compare each exported overview with explicit expected nodes and edges, then verify its rendered and saved diagram text.

**Acceptance Scenarios**:

1. **Given** separate topics and databases folders exporting their full node arrays, **When** both service folders construct their relationships, **Then** their edges reference the original exported infrastructure nodes rather than copies.
2. **Given** each service folder exports its service node, module collection, and local set of service, modules, and all relationships, **When** its event overview is derived, **Then** starting service nodes are selected from that local set and topics are discovered by following only predicate-accepted outgoing event edges.
3. **Given** a shared topic and a topic specific to each service, **When** both overview sets are inspected, **Then** each contains its own service and modules and the relevant original topic nodes, while excluding the other service, the other service's modules, unrelated topics, and all database nodes.
4. **Given** a local set includes module, event, and database edges, **When** reached topics are merged and the general cleanup operation runs, **Then** module and event edges remain and database edges are removed, without changing the original local set or infrastructure collections.
5. **Given** a topic referenced by a qualifying event edge, **When** an overview is derived, **Then** the topic is discovered from that edge without a separately maintained overview topic list.
6. **Given** both service folders export their derived overview sets, **When** the integration test renders and saves each array, **Then** exact membership and diagram contents match independently specified expectations.

### Edge Cases

- Empty selections, isolated nodes, and predicates rejecting every edge produce no reached nodes.
- Undefined opposite endpoints are skipped during traversal; edges with either undefined endpoint are removed during cleanup.
- Outgoing traversal excludes incoming-only edges; incoming traversal excludes outgoing-only edges; both follows either. Cycles do not cause recursive traversal.
- Repeated references to one node produce one discovered node; distinct nodes with equal display labels remain distinct.
- Parallel edges remain distinct even when their target is deduplicated.
- A matching self-loop returns its node once and survives cleanup if that node is selected.
- A discovered node already present in the original selection occurs once in the merged selection.
- Cleanup preserves selected isolated nodes and never adds missing endpoints.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Authors MUST be able to select nodes from mixed node/edge collections using existing host-language selection facilities and author-defined criteria.
- **FR-002**: The framework MUST provide reusable one-hop traversal with an explicit outgoing, incoming, or both direction and an author-defined edge predicate. The predicate MUST receive each edge in the selected direction before the hop so the author can filter by type, properties, or endpoints. Accepted outgoing edges reach their defined targets, incoming edges reach their defined sources, and both-direction traversal reaches the opposite endpoint relative to each start. Edge filtering MUST remain independent of starting-node selection and MUST NOT be replaced by filtering reached nodes after traversal. The operation MUST be domain-independent.
- **FR-003**: Reached nodes MUST preserve source identity, omit duplicate references, and retain first-discovery order according to unique selected-start order and the chosen adjacency snapshot order. Both-direction traversal MUST use incident registration order and evaluate a self-loop once per start. An edge joining two selected starts is evaluated once per start; starting selections guarantee uniqueness through a native set, so each start is processed once.
- **FR-004**: The framework MUST provide reusable selection cleanup retaining nodes and retaining an edge only when both endpoints are defined and present by identity. Cleanup MUST preserve retained input order and distinct parallel edges.
- **FR-005**: Querying, merging, cleaning, and exporting MUST leave source elements, exported collections, and adjacency unchanged.
- **FR-006**: The integration example MUST compose independently exported node/edge collections, including edges to shared nodes, while preserving original element identities.
- **FR-007**: Authors MUST be able to derive a selection by selecting starting nodes, following qualifying edges in the chosen direction, merging reached nodes with an existing node/edge collection, and removing edges with endpoints outside the result. Each element reference MUST occur once in the merged selection.
- **FR-008**: The integration example MUST include nodes reached from multiple starting nodes, nodes reached from only one starting node, and unrelated nodes to make inclusion and exclusion verifiable. Story 3 defines the concrete microservice test case.
- **FR-009**: Integration coverage MUST assert exact derived selection membership, retained and excluded edges, shared source identities, independently specified expected diagram contents for each example selection, saved contents, and repeated-export stability.
- **FR-010**: Automated coverage MUST verify all three directions, incident ordering, shared edges between starts, empty results, undefined endpoints, incoming-only edges, parallel edges, self-loops, repeated references, equal-label distinct nodes, and source collection and adjacency preservation.
- **FR-011**: Traversal MUST inspect only selected nodes' adjacency in the chosen direction; disconnected elements MUST NOT increase predicate evaluations. Cleanup MUST support work proportional to selection size rather than repeatedly searching the full model for each edge.
- **FR-012**: Existing direct traversal and export behavior MUST remain available. Cleanup MUST be explicitly requested rather than silently applied to all exports.

### Key Entities *(include if feature involves data)*

- **Node**: A graph element that can be selected, used as a traversal starting point, or reached as an edge target; domain-specific node types remain author-defined.
- **Edge**: A directed connection between nodes with author-defined meaning and potentially undefined endpoints.
- **Edge Predicate**: An author-defined filter evaluated on an edge in the chosen direction before traversal; acceptance permits a hop across that edge, and rejection prevents it.
- **Traversal Direction**: Outgoing follows targets, incoming follows sources, and both follows opposite endpoints from incident edges; every mode is one hop.
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

- The example provides a short consumer test in `tests/integration/quickstart.test.ts` and detailed acceptance coverage in `tests/integration/microservice-environment.test.ts`; reusable utilities belong in the main package under `src/`. Exact public names and signatures are planning decisions.
- Service, module, topic, and database types belong only to the integration test case; framework operations use generic nodes and edges.
- Separate folders and ordinary module exports suffice; governed partitions are not a prerequisite.
- In the integration test case only, event relationships are directed from services to topics, including subscriptions in this example; author-defined meaning distinguishes event, database, and module interactions.
- In the integration test case only, the starting service export includes its service node, modules, and relationships. Topics are discovered; databases are not merged.
- Cleanup requires both endpoints, generalizing the requested target exclusion to any self-contained selection.
- Identity means the same in-memory element, not equal identifiers or display labels.
- Efficiency means local traversal and proportional selection processing; no arbitrary elapsed-time threshold is imposed.
- Multi-hop search, a query language, graph storage, runtime partition governance, and automatic global discovery are out of scope.

## Query Collection Boundary

Graph collections use ReadonlySet: adjacency snapshots, helper inputs/results, and fixture exports. Callers establish reference uniqueness with native sets or readonlySet. Returned collections are runtime-protected snapshots with insertion-order iteration. Filtering uses ordinary array operations after spreading a set, then creates a new set. Diagram export accepts Iterable<GraphElement>, including sets, arrays, and generators. The generalized partition interface remains a subsequent feature.

## Metamodel Element Definitions

The example metamodel exports callable definitions for all seven node/relationship types, with TypeScript type-only class exports. Core defineElement preserves each constructor's full argument tuple, shallow-freezes completed instances, and supplies an instanceof-based .is guard that narrows values to the implementation type. Definitions are frozen. Recognition accepts subclasses without changing existing instances. Domain-specific properties such as event kind and relationship labels remain constructor-defined. Normal edge construction and adjacency registration are preserved. Deep freezing, graph registries, and partition interface design are excluded.
