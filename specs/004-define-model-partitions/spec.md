# Feature Specification: Define Model Partitions

**Feature Branch**: `004-define-model-partitions`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "Create feature 004 with a branch. Enable core to define a partition in a *.partition.ts file exporting an interface with id, name, named exports of contained elements (key: immutable set), named diagram exports (key: { data: set, inNotation: string }), and its metamodel exports. Establish a partition folder convention with metamodel, elements, and diagrams folders."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Publish and Consume a Partition (Priority: P1)

A model author groups related model content into a partition with a stable identity, a readable name, named element collections, and reusable metamodel definitions. A consumer accesses this public contract without depending on the partition's internal files.

**Why this priority**: A consistent publication boundary makes independently authored model content discoverable and reusable.

**Independent Test**: Define a partition with two named element collections and a metamodel definition, consume its public entry file, and verify identity, names, membership, and definition reuse.

**Acceptance Scenarios**:

1. **Given** a partition definition, **When** a consumer imports its public entry file, **Then** the partition exposes its `id`, `name`, named element collections, named diagram collection, and metamodel exports through the core-supported contract.
2. **Given** two named element collections, **When** a consumer selects either by key, **Then** exactly its published members are available, retaining their original identities and iteration order.
3. **Given** the same element is published in two collections, **When** both are consumed, **Then** they refer to the same element, with no cloning or identity rewriting.
4. **Given** a partition publishes metamodel definitions, **When** a consumer uses a published definition to create an element, **Then** the existing definition and element behavior remain available without importing internal files.
5. **Given** published partition content, **When** a consumer attempts to replace a published entry, change an exported element's state, or add or remove collection members, **Then** the mutation is prevented and the published content remains unchanged.
6. **Given** a declaration omits a required contract member or supplies an incompatible value, **When** it is checked against the core partition contract, **Then** it is identified as nonconforming and the offending member is identifiable.

---

### User Story 2 - Publish Named Diagrams (Priority: P1)

A model author publishes named diagrams alongside model content so consumers can obtain both the selection represented by a diagram and its textual representation.

**Why this priority**: Diagrams are an explicit part of the requested partition contract and connect reusable model selections to reviewable output.

**Independent Test**: Publish two diagrams with different selections and text, retrieve each by name, and compare the returned data and text with the author's supplied values.

**Acceptance Scenarios**:

1. **Given** a named diagram, **When** a consumer retrieves it, **Then** it exposes `data` as an immutable set of model elements and `inNotation` as the authored diagram text string.
2. **Given** multiple named diagrams, **When** a consumer retrieves one by key, **Then** only that diagram's selection and text are returned without merging other diagrams.
3. **Given** diagram data derived using existing selection operations, **When** the author publishes the selection and its generated text, **Then** element identities and the exact text are preserved.
4. **Given** a published diagram, **When** a consumer attempts to change its data membership or replace its text, **Then** the mutation is prevented and subsequent reads return unchanged content.
5. **Given** empty diagram data and an author-supplied string, **When** the diagram is consumed, **Then** the empty selection and exact string, including an empty string, remain available.

---

### User Story 3 - Navigate a Consistent Partition Folder (Priority: P2)

A model author follows a documented folder convention so another author can locate the partition's public entry point, metamodel, elements, and diagrams without learning a different layout for every partition.

**Why this priority**: A predictable layout lowers the effort needed to understand and maintain model contributions.

**Independent Test**: Follow the documented example to create a partition folder and consume its entry point without accessing its internal folders directly.

**Acceptance Scenarios**:

1. **Given** a conforming partition folder, **When** an author inspects it, **Then** its root contains one public `*.partition.ts` entry file and the `metamodel/`, `elements/`, and `diagrams/` folders.
2. **Given** the convention and a complete example, **When** an author locates each kind of source, **Then** reusable definitions are under `metamodel/`, element declarations under `elements/`, and diagram selections and text generation under `diagrams/`.
3. **Given** two conforming partition folders, **When** a consumer imports their public entry files, **Then** each partition's identity and named exports remain independently accessible without a framework-specific module loader.

### Edge Cases

- A partition may publish no elements, diagrams, or metamodel definitions; all export groups remain present and empty.
- An empty named element set is valid and remains distinguishable from an absent export key.
- Repeated references to one element within a set occur once; distinct elements are not merged solely because their identifiers or labels match.
- The same export key may be used in different export groups or different partitions without conflating their values. Keys are unique within each group.
- Diagram selections may include elements imported from another partition. Publication does not change their identities or require all diagram members to appear in a local element export.
- Edges with omitted or undefined endpoints retain existing core behavior; publishing a partition does not silently clean selections or invent endpoints.
- A missing export key remains absent; no fallback collection or diagram is invented.
- Missing contract members, element exports that are not sets, diagram records missing `data` or `inNotation`, and non-string diagram text are nonconforming declarations.
- Folder names and the `.partition.ts` suffix are exact conventions; automatic filesystem discovery or layout enforcement is not required.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The core MUST provide a reusable partition contract that lets authors publish `id`, `name`, named element exports, named diagram exports, and metamodel exports from a `*.partition.ts` entry file.
- **FR-002**: Each partition MUST expose an author-assigned stable string `id` and a human-readable string `name`, preserved exactly for consumers.
- **FR-003**: Named element exports MUST map author-chosen keys to immutable sets of existing model elements, preserving reference identity, set uniqueness, and iteration order.
- **FR-004**: Named diagram exports MUST map author-chosen keys to records containing `data`, an immutable set of model elements, and `inNotation`, a string containing that diagram's textual representation.
- **FR-005**: Metamodel exports MUST expose author-selected reusable element definitions by name so consumers can use them through the public partition boundary.
- **FR-006**: Consumers MUST NOT be able to mutate the published contract, export mappings, diagram records, collection membership, or shared exported model state. Protection MUST hold at runtime, rather than relying solely on compile-time restrictions.
- **FR-007**: Publication MUST preserve supplied element and definition identities and diagram text. It MUST NOT clone elements, rename identifiers, automatically expand or clean selections, or regenerate supplied text.
- **FR-008**: All three export groups MUST support zero or more named entries. Named element sets and diagram data MUST support empty selections.
- **FR-009**: Authors MUST receive feedback identifying incompatible or missing contract members when checking a partition declaration. This feature does not require a runtime validator for arbitrary external input.
- **FR-010**: The documented folder convention MUST place one public `*.partition.ts` file at the partition folder root, reusable metamodel definitions in `metamodel/`, element declarations in `elements/`, and diagram definitions in `diagrams/`. All three folders are part of the convention even when a category is empty.
- **FR-011**: Authors and consumers MUST be able to use ordinary host-language imports and exports for partition publication and reuse, without a custom dependency resolver or registry.
- **FR-012**: Documentation MUST include a complete conforming example with identity, at least two named element sets, at least two named diagrams, a reusable metamodel export, and consumption through the public entry file. It MUST explain how each folder contributes to that contract.
- **FR-013**: Existing graph creation, traversal, selection, and textual diagram export workflows MUST remain usable with partition-published elements and diagram data.

### Key Entities

- **Partition**: A named publication boundary identified by `id` and `name`, exposing element collections, diagrams, and a metamodel.
- **Named Element Export**: An author-chosen key paired with an immutable set of model elements.
- **Named Diagram Export**: An author-chosen key paired with immutable model data and its textual diagram representation.
- **Metamodel Export**: A named reusable element definition made available to partition consumers.
- **Partition Entry File**: The public `*.partition.ts` file through which consumers obtain the partition contract.
- **Partition Folder**: The source container organizing the entry file and its metamodel, elements, and diagrams.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A consumer can retrieve both named element collections, both named diagrams, and the reusable metamodel definition in the reference example through one partition entry point, with zero imports from its internal folders.
- **SC-002**: Every published collection in the acceptance examples contains exactly the expected members in the expected order, preserving 100% of source element identities.
- **SC-003**: Every attempted mutation covered by the acceptance scenarios leaves published content unchanged, including collection membership, diagram text, and shared element state.
- **SC-004**: Across 100 repeated reads of unchanged reference partitions, all export names, memberships, identities, and diagram text remain identical.
- **SC-005**: Every intentionally malformed declaration described in the edge cases is identified as nonconforming, while empty but structurally complete partitions are accepted.
- **SC-006**: An author following the complete example can locate all four source categories—public entry, metamodel, elements, and diagrams—and reproduce publication and consumption without undocumented setup.

## Assumptions

- This feature builds on the graph core, diagram export, immutable sets, and reusable element definitions established by features 001–003.
- “Named exports” means named entries in the partition's element, diagram, and metamodel export groups. The exact enclosing member names and helper signatures are planning decisions; `id`, `name`, `data`, and `inNotation` are requested contract names.
- `inNotation` means the rendered textual diagram, not a notation identifier. Authors generate it using existing diagram capabilities and supply any required boundary text themselves. Automatic consistency checking between supplied text and data is outside scope.
- A partition entry file exports a partition value satisfying the core contract. Choosing a default or named module export is a planning decision.
- The metamodel contains author-selected reusable definitions; publication does not automatically discover or export every definition referenced by an element.
- Partition identifiers are assigned by authors. Global uniqueness enforcement, ownership tracking, namespace rewriting, dependency graph validation, automatic discovery, CLI generation, and partition assembly remain outside this feature.
- The folder convention is documented and demonstrated; an automatic scaffolder or filesystem validator is not required.
- Runtime protection of shared exports must satisfy the constitution; the protection mechanism and compatibility with graph adjacency are planning concerns.
- The broader roadmap in `specs/999-governed-model-partitions/spec.md` remains deferred and does not expand feature 004's scope.

## Folder Layout Refinement

- Child partitions reside under an optional `partitions/` directory, separating them from the parent’s own metamodel, elements, and diagrams. The convention is recursive and does not imply automatic loading.
- The microservice example has a root with databases, topics, and services children; services contains service A and service B partitions and owns their shared metamodel. Topic/database definitions belong to their respective partitions.
- Partition integration coverage extends `tests/integration/microservice-environment.test.ts` and preserves the existing model and diagram expectations.
