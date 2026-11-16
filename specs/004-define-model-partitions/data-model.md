# Data Model: Define Model Partitions

## Partition

| Field | Type | Meaning / rules |
| --- | --- | --- |
| `id` | string | Author-assigned identity; preserved verbatim; no global uniqueness registry |
| `name` | string | Human-readable name; preserved verbatim |
| `elements` | named readonly set mapping | Required; zero or more own string-keyed collections of GraphElement |
| `diagrams` | named diagram mapping | Required; zero or more own string-keyed PartitionDiagram values |
| `metamodel` | named definition mapping | Required; zero or more existing callable ElementDefinition values |

All fields and mapping entries are readonly. Names are unique within one mapping; names may repeat across groups and partitions. Empty strings are not additionally prohibited by this feature. Keys are case-sensitive and receive no normalization. Only explicit own entries are published; missing names return no value in dynamic lookup.

## Named element collection

An immutable ordered set of GraphElement references. Snapshot membership is independent of the caller's original set. References deduplicate by object identity, not domain identifiers. Separate exported sets may share elements. Publication protects supported own state in place; it does not copy or rename elements.

## PartitionDiagram

| Field | Type | Meaning / rules |
| --- | --- | --- |
| `data` | ReadonlySet of GraphElement | Immutable membership snapshot, preserving member subtypes, references, and order |
| `inNotation` | string | Exact author-supplied textual representation, including whitespace or empty text |

Diagram records are copied and frozen. Data may include imported elements or elements not present in `elements`. No data/text equivalence validation, automatic selection cleanup, or endpoint completion occurs.

## Metamodel definition

Existing callable `ElementDefinition<Args, T>` values retain their argument tuple, return type, `.is` type guard, and reference identity. The partition mapping and callable public surface are protected. Construction through a definition retains existing `defineElement` semantics; newly created instances become partition-protected only when published themselves.

## State and publication lifecycle

1. Author builds metamodel definitions, graph instances, selections, and text using existing capabilities.
2. TypeScript checks all required members and their types.
3. `definePartition` captures own mapping entries and set membership and preflights supported reachable data.
4. Unsupported mutable payloads fail with a path-bearing TypeError before the freezing phase; no partition value is returned.
5. Supported own data is frozen in place; copied mappings, diagram records, and the partition shell are frozen and returned.
6. Consumers read the stable publication. No update, delete, refresh, or persistence lifecycle is added.

Freezing in place also protects pre-existing aliases to published data. It may freeze endpoint objects reachable through an exported edge even if those nodes are not members of an exported selection. Adjacency lives outside the own-data graph and remains live; prior snapshots and partition collections remain unchanged when new edges are constructed.

## Supported state boundary

Primitives, arrays, plain records, and graph instances may form cyclic or shared own-data graphs. Own accessors and unsupported built-in/custom mutable payload objects are rejected. Definitions and behavior must obey the pure authoring contract in [the public contract](contracts/partition-contract.md). Prototype mutation, hidden mutable private state, and arbitrary hostile objects are outside that contract. This feature is not a general object serialization or security system.
