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
5. **Given** published partition content, **When** a consumer attempts to replace a published entry or add or remove collection members, **Then** the mutation is prevented and the published content remains unchanged.
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

1. **Given** a conforming partition folder, **When** an author inspects it, **Then** its root contains one public `[name].partition.ts` entry file; supporting folders, when needed, use `_` prefixes.
2. **Given** the convention and a complete example, **When** an author locates each kind of source, **Then** definitions can live under `_metamodel/`, and elements and diagrams can use ordinary files or `_elements/` and `_diagrams/` folders.
3. **Given** two conforming partition folders, **When** a consumer imports their public entry files, **Then** each partition's identity and named exports remain independently accessible without a framework-specific module loader.

### Edge Cases

- A partition may publish no elements, diagrams, or metamodel definitions; all export groups remain present and empty.
- An empty named element set is valid and remains distinguishable from an absent export key.
- Repeated references to one element within a set occur once; distinct elements are not merged solely because their identifiers or labels match.
- The same export key may be used in different export groups or different partitions without conflating their values. Keys are unique within each group.
- Diagram selections may include elements imported from another partition. Publication does not change their identities or require all diagram members to appear in a local element export.
- Edges with omitted or undefined endpoints retain existing core behavior; publishing a partition does not silently clean selections or invent endpoints.
- A missing export key remains absent; no fallback collection or diagram is invented.
- Missing identity or name, element exports that are not sets, diagram records missing `data` or `inNotation`, and non-string diagram text are nonconforming declarations.
- Folder names and the `.partition.ts` suffix are exact conventions; automatic filesystem discovery or layout enforcement is not required.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The core MUST provide a reusable partition contract that lets authors publish `id`, `name`, named element exports, named diagram exports, and metamodel exports from a `*.partition.ts` entry file.
- **FR-002**: Each partition MUST expose an author-assigned stable string `id` and a human-readable string `name`, preserved exactly for consumers.
- **FR-003**: Named element exports MUST map author-chosen keys to immutable sets of existing model elements, preserving reference identity, set uniqueness, and iteration order.
- **FR-004**: Named diagram exports MUST map author-chosen keys to records containing `data`, an immutable set of model elements, and `inNotation`, a string containing that diagram's textual representation.
- **FR-005**: Metamodel exports MUST expose author-selected reusable element definitions by name so consumers can use them through the public partition boundary.
- **FR-006**: The framework MUST prevent runtime mutation of the published shell, export mappings, diagram records, and collection membership. Authors MUST maintain immutable shared model state. Publication MUST pass elements, endpoints, definitions, and guards through unchanged, without recursive inspection, payload restrictions, or additional freezing.
- **FR-007**: Publication MUST preserve supplied element and definition identities and diagram text. It MUST NOT clone elements, rename identifiers, automatically expand or clean selections, or regenerate supplied text.
- **FR-008**: All three contribution groups MUST be optional inputs. Omitted groups MUST become empty immutable mappings in the result. Named element sets and diagram data MUST support empty selections.
- **FR-009**: Authors MUST receive feedback identifying incompatible or missing contract members when checking a partition declaration. This feature does not require a runtime validator for arbitrary external input.
- **FR-010**: The folder convention MUST use one `[name].partition.ts` entry per partition and `_` prefixes only for supporting folders. Hierarchy MUST derive solely from folders, using the nearest ancestor partition; no child registration or export forwarding is required. Small contributions MAY use ordinary files. Empty categories need no placeholders.
- **FR-011**: Authors and consumers MUST be able to use ordinary host-language imports and exports for partition publication and reuse, without a custom dependency resolver or registry.
- **FR-012**: Documentation MUST include a complete example spanning identity-only, vocabulary, element, and diagram contributions, at least two named element sets and two diagrams, and native-import consumption. Entries publish locally maintained contributions; vocabulary ownership is independent of hierarchy.
- **FR-013**: Existing graph creation, traversal, selection, and textual diagram export workflows MUST remain usable with partition-published elements and diagram data.

### Key Entities

- **Partition**: A named publication boundary identified by `id` and `name`, exposing element collections, diagrams, and a metamodel.
- **Named Element Export**: An author-chosen key paired with an immutable set of model elements.
- **Named Diagram Export**: An author-chosen key paired with immutable selection membership and its textual diagram representation.
- **Metamodel Export**: A named reusable element definition made available to partition consumers.
- **Partition Entry File**: The public `*.partition.ts` file through which consumers obtain the partition contract.
- **Partition Folder**: The source container organizing the entry file and its metamodel, elements, and diagrams.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A consumer can retrieve both named element collections, both named diagrams, and the reusable metamodel definition in the reference example through one partition entry point, with zero imports from its internal folders.
- **SC-002**: Every published collection in the acceptance examples contains exactly the expected members in the expected order, preserving 100% of source element identities.
- **SC-003**: Every attempted mutation covered by the acceptance scenarios leaves published content unchanged, including collection membership and diagram text; immutable element state is the author’s responsibility.
- **SC-004**: Publication preserves export names, memberships, identities, and diagram text after caller-owned containers are changed; focused unit tests verify this without redundant repeated-read loops.
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
- Shared model state is immutable by author design; framework runtime protection covers publication containers and membership. This division follows constitution IV’s design-based option and does not require recursive enforcement.
- The broader roadmap in `specs/999-governed-model-partitions/spec.md` remains deferred and does not expand feature 004's scope.

## Folder Layout Refinement

Each partition has one `[name].partition.ts` entry exporting a named `partition`.
The folder tree is the sole hierarchy source: a partition's parent is the nearest
ancestor folder containing a partition entry. Intermediate organizational folders
need no declaration. Supporting folders use `_` prefixes (`_metamodel/`,
`_elements/`, `_diagrams/`, or `_shared/`); their contents are excluded from future
hierarchy discovery. Files themselves have no prefix: small contributions can live
in `elements.ts` and `diagrams.ts`. Empty categories need no files or folders.

Partition entries publish locally maintained contributions, not forwarded child
exports. A locally maintained selection or diagram can reference foreign elements.
All three contribution groups are optional inputs and normalize to frozen empty
mappings in the output. Identity-only and vocabulary-only partitions are valid.
Metamodel ownership is independent of hierarchy: imports can flow top-down,
bottom-up, or across branches. Cross-partition imports use partition entries, including vocabulary imports.
Consumers retrieve individual elements by ID from the published sets. Core does not infer or enforce ownership.

There is no `children` registry. CLI discovery/build/publish and delegation contracts
are future work; this change establishes their folder convention without implementing
a scanner, contract engine, or placeholder contract files.

## ID lookup query addition

Provide `findById(set, id)` for authoring relationships from published selections.
Members must declare an `id`; the lookup argument must match its declared type.
Return the first strict-equality match in iteration order, preserving its identity,
or `undefined` if absent. Do not copy the collection, enforce uniqueness, resolve
references globally, or change base Node/Edge constructors. Missing references remain `undefined`; relationship definitions accept them as
missing endpoints, and `cleanSelection` can omit dangling relationships from views. Both native and protected readonly sets are supported.

## Reusable endpoint typing addition

Export `Endpoint<T extends Node = Node> = T | undefined` and make `Edge` generic
in its source and target node types, defaulting both to Node. Preserve readonly
endpoint properties, undefined endpoint support, reference identity, adjacency,
and compatibility with existing graph/query APIs. Constructor inference and
`defineElement` must retain concrete endpoint types. Fixture relationship classes
use the shared endpoint type and typed properties without casts. This introduces
no ID requirement or endpoint resolution behavior.
