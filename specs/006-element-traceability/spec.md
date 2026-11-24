# Feature Specification: Element Traceability

**Feature Branch**: `006-element-traceability`

**Created**: 2026-11-24

**Status**: Draft

**Input**: Extend the CLI from feature 005 with a command that accepts exactly one element ID and shows its existing relationships as a tree. The default depth is one. Support the existing root, partition, path, format, and tsconfig options. Give every core node and edge an authored name and expose it consistently in the CLI.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Direct Relationships (Priority: P1)

A model author looks up an element by ID to see which elements it relates to and which elements relate to it.

**Why this priority**: A single lookup shows which model elements are directly connected.

**Independent Test**: Trace a published element with incoming and outgoing relationships of one type, outgoing relationships of another type, and a missing endpoint. Compare the result with the authored connections.

**Acceptance Scenarios**:

1. **Given** a published element with incoming and outgoing relationships, **When** its ID is traced with default options, **Then** the result shows the root and related elements by model type, name, and ID, and each direct relationship branch shows the edge type, name, ID, and direction.
2. **Given** two outgoing relationships with distinct IDs and the same type and target, **When** the source is traced, **Then** each edge has its own `To` branch labeled with its ID, and both branches show the same target.
3. **Given** an isolated element or one with only missing opposite endpoints, **When** it is traced, **Then** the result contains just the root.
4. **Given** a published relationship ID, **When** it is traced, **Then** the relationship is the root and its available endpoints appear under branches showing its type, name, and ID with `From` for the source and `To` for the target.

Example of the default output:

```text
OrderService: Order Service (orders)
├── ServiceCall: Primary Payment (payment-primary) -> To 
│   └── PaymentService: Payment Service (payments)
├── ServiceCall: Fallback Payment (payment-fallback) -> To
│   └── PaymentService: Payment Service (payments)
├── ServiceCall: Submit Order (storefront-orders) -> From
│   └── Storefront: Online Store (storefront)
└── ServicePublishing: Publish Order Created (orders-created) -> To
    └── OrderCreatedEvent: Order Created (order-created)
```

---

### User Story 2 - Follow Relationships Across Hops (Priority: P2)

A reviewer increases the depth to see how the starting element connects to elements farther away.

**Why this priority**: A reviewer can follow indirect paths and choose how much of the model to see.

**Independent Test**: Trace a graph containing a chain, a cycle, and two paths to the same element at depths one, two, and three.

**Acceptance Scenarios**:

1. **Given** a chain of at least three hops, **When** the user requests depth two, **Then** the tree includes the first two hops and the second-hop elements appear as leaves.
2. **Given** an unused relationship returning to an ancestor, **When** the trace reaches that connection, **Then** it shows the ancestor as a leaf on that path.
3. **Given** two paths to the same element within the requested depth, **When** the user traces the root, **Then** the element appears on both paths.
4. **Given** a link to an element outside the selected partitions, **When** the root is traced, **Then** the linked element appears if the connection and endpoint are available in the loaded model.

---

### User Story 3 - Scope the Lookup and Read Results in Automation (Priority: P2)

A CLI user scopes the lookup with familiar partition selectors and can read the same trace as structured data.

**Why this priority**: Shared options integrate traceability into existing workflows and let users narrow down the elements they want to inspect.

**Independent Test**: Publish one object through two exports and a distinct object with the same ID in another partition. Trace it with and without partition selectors in both formats.

**Acceptance Scenarios**:

1. **Given** that the same object appears in several selected exports, **When** its ID is traced, **Then** it resolves to a single root.
2. **Given** distinct selected elements with the same ID, **When** that ID is traced, **Then** the command succeeds and shows a separate tree for each matching object. Narrowing the selection can reduce the number of trees.
3. **Given** a valid root, **When** the user chooses JSON, **Then** standard output contains one result document with the same ordered trees as the default format, with model type, authored name, and ID for every node and edge.
4. **Given** zero IDs, multiple IDs, an unknown ID, or an invalid depth, **When** the command runs, **Then** it exits unsuccessfully with an actionable error in the selected format.
5. **Given** a healthy entry requiring a project config and an unrelated broken entry, **When** the user supplies the config and a path selector for the healthy entry, **Then** the command applies the config and resolves the root without loading the unrelated entry solely for traceability.
6. **Given** a valid element ID, **When** the user supplies `--property name` or an unknown option such as `--nonsens fff`, **Then** the command reports an unsupported option in the selected format, exits unsuccessfully, and produces no trace tree.

---

### User Story 4 - Name Model Elements Consistently (Priority: P1)

A model author assigns a name to every node and edge. Reviewers see that same name in trace trees, element listings, and endpoint summaries.

**Why this priority**: Consistent names make model elements recognizable across commands, even when multiple elements have the same model type.

**Independent Test**: Author two nodes and an edge with names, publish the edge without one of its endpoint nodes, and compare the names shown by element listing and traceability in both formats.

**Acceptance Scenarios**:

1. **Given** a node and an edge, **When** the author creates them, **Then** each requires a readonly string name alongside its existing ID. A model author may reuse a name on distinct elements.
2. **Given** a named edge whose endpoint is outside the selected export, **When** it is listed, **Then** the edge and its present endpoints show their authored names in both formats.
3. **Given** an element whose business-attribute customization omits or supplies a different name, **When** any CLI element view displays it, **Then** its first-class name is used.
4. **Given** a listing projected with `--property name` or with a different attribute filter, **When** it is run, **Then** the projection succeeds and the canonical name remains visible as identity metadata.

### Edge Cases

- A self-relationship has both directions. Each branch shows the node as a leaf when the relationship is reached.
- Parallel relationships contribute separate branches, including when distinct edge objects share an authored ID. Publishing the same edge again does not add another branch.
- In an empty selected model, any starting ID is unknown. ID matching is exact and case-sensitive, including whitespace.
- A relationship root with one available endpoint shows one branch. With neither endpoint available, it appears by itself.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The CLI MUST expose `trace-element <element-id>` and require exactly one nonempty positional ID for a trace. The separate `model-forge help trace-element` command MUST document trace options, formats, lookup scope, and direction labels. `model-forge version` MUST report the CLI version. Both commands MUST run without loading model sources.
- **FR-002**: The command MUST accept `--root`, `--partition-id`, `--partition-name`, `--path`, `--format`, and `--tsconfig` with the defaults and selection semantics defined in feature 005.
- **FR-003**: The command MUST resolve an exact, case-sensitive ID among nodes and relationships published in element exports and diagram selections of the selected partitions. It MUST show one tree per distinct matching object, ordered by first occurrence across the selected exports. Repeated publication of the same object MUST yield one tree. The command MUST fail if no object matches.
- **FR-004**: The command MUST show each matching element as a root and show a separate branch under each expanded element for each relationship and direction. `To` identifies the outgoing connection to a target and `From` identifies the incoming connection from a source. For a relationship root, these labels identify its own target and source respectively.
- **FR-005**: Output MUST include only existing relationships with present related elements, including connections outside the lookup scope that are available in the loaded model. Every relationship branch MUST contain exactly one related element. Parallel edges MUST remain separate branches.
- **FR-006**: The command MUST accept optional `--depth <positive-integer>` with a default of one. Moving from an element to a related element counts as one hop, including from a relationship root to an endpoint. Elements at the requested depth MUST appear as leaves.
- **FR-007**: The command MUST omit any relationship already used on the current path, including the root relationship when tracing from a relationship. A connection through an unused relationship to an ancestor element MUST show that ancestor as a leaf. Other paths MUST be evaluated independently.
- **FR-008**: Default pretty output MUST render a terminal tree using `├──` for nonfinal siblings, `└──` for final siblings, and `│` to continue branches through nested levels. Pretty output MUST identify the root and each related element as `ElementType: Name (id)`. Relationship branches MUST use the same format with `To` or `From` appended. JSON MUST provide the same ordered trees as an array in the feature 005 result envelope. Both formats MUST include the model type, authored name, and authored ID for each node or edge, and the direction for each relationship branch.
- **FR-009**: Branches MUST be ordered by relationship type name, with `To` preceding `From` for the same type. Branches with the same type and direction MUST retain the authored model's relationship order. The command MUST leave the model and its exports unchanged.
- **FR-010**: Invalid arguments, unknown IDs, and source-loading failures MUST follow existing CLI error and exit behavior. JSON mode MUST emit one result document on success or failure.

- **FR-011**: The core model contract MUST require every node and edge to have a readonly, author-supplied string `name` as first-class metadata alongside its ID. Authors are responsible for uniqueness where their models require it. Core and CLI code MUST NOT enforce element ID or name uniqueness. Trace lookup uses the ID and returns all distinct matches.
- **FR-012**: The CLI MUST read the canonical name from the core element contract in `trace-element`, `list-elements`, and present endpoint summaries in pretty and JSON output. Business-attribute customization and projection MUST leave the canonical name intact. `list-elements --property name` MUST remain a valid request and return the name through element identity. Listing and endpoint identity MUST contain only the core `id` and `name` fields. Other authored properties MUST follow the generic business-attribute rules.
- **FR-013**: Existing node and edge declarations, subclasses, construction sites, examples, fixtures, and public core and CLI documentation MUST be migrated to the required-name contract. Existing authored names MUST be preserved where models already provide them. Test fixtures that use `label` as a display value MUST move that value to `name`. Documentation MUST describe the core API change and name placement in CLI output.

- **FR-014**: `trace-element` MUST reject `--property` through the same argument-error handling used for other unsupported options. Its help MUST list only options it accepts.

### Key Entities

- **Trace Root**. One published node or relationship that matches the requested ID.
- **Relationship Branch**. An existing relationship in a given direction, with its type, authored name, authored edge ID, and related element.
- **Trace Tree**. The root and its nested relationship branches up to the requested hop depth.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a reference model with at least two relationship types and both directions, the default trace shows a branch with the correct edge type, name, ID, and direction, plus the related element type, name, and ID for every direct connection with a present endpoint, including parallel edges. It has zero empty branches and zero second-hop entries.
- **SC-002**: At depths one, two, and three in a reference model with a cycle and shared neighbors, every expected path appears, no path exceeds the requested depth, and no path traverses the same relationship twice.
- **SC-003**: One match yields one tree, multiple distinct matches yield one tree per match, and no match yields a nonzero exit status in both formats. Every JSON run produces exactly one parseable document.
- **SC-004**: Three runs on unchanged sources produce identical ordered output within each format and leave the authored model unchanged.

- **SC-005**: Every migrated example and fixture has authored names for its nodes and edges. For every published node, edge, and present endpoint in the reference model, both CLI formats show the same canonical name even when business attributes are projected or customized.

## Assumptions

- Feature 005 provides discovery, shared options, authored element IDs, and the pretty and JSON output conventions.
- Partition selectors scope the starting ID lookup. Existing connections outside the selected partitions can appear when already available in the loaded model.
- Depth counts relationship hops and accepts positive integers.
