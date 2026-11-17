# Data Model: Define Model Partitions

## Partition

| Field | Type | Meaning / rules |
| --- | --- | --- |
| `id` | string | Author-assigned identity; preserved verbatim; no global uniqueness registry |
| `name` | string | Human-readable name; preserved verbatim |
| `elements` | named readonly set mapping | Optional input, always present in output; zero or more own string-keyed collections of GraphElement |
| `diagrams` | named diagram mapping | Optional input, always present in output; zero or more own string-keyed PartitionDiagram values |
| `metamodel` | named definition mapping | Optional input, always present in output; zero or more existing callable ElementDefinition values |

All fields and mapping entries are readonly. Names are unique within one mapping; names may repeat across groups and partitions. Empty strings are not additionally prohibited by this feature. Keys are case-sensitive and receive no normalization. Only explicit own entries are published; missing names return no value in dynamic lookup.

## Named element collection

An immutable ordered set of GraphElement references. Snapshot membership is independent of the caller's original set. References deduplicate by object identity, not domain identifiers. Separate exported sets may share elements. Authors maintain immutable element state; publication does not inspect, freeze, copy, or rename elements.

## PartitionDiagram

| Field | Type | Meaning / rules |
| --- | --- | --- |
| `data` | ReadonlySet of GraphElement | Immutable membership snapshot, preserving member subtypes, references, and order |
| `inNotation` | string | Exact author-supplied textual representation, including whitespace or empty text |

Diagram records are copied and frozen. Data may include imported elements or elements not present in `elements`. No data/text equivalence validation, automatic selection cleanup, or endpoint completion occurs.

## Metamodel definition

Existing callable `ElementDefinition<Args, T>` values retain their argument tuple, return type, `.is` type guard, and reference identity. The partition mapping is protected; definitions and guards pass through unchanged. Construction retains existing `defineElement` semantics.

## State and publication lifecycle

1. Author builds metamodel definitions, graph instances, selections, and text using existing capabilities.
2. TypeScript checks all required members and their types.
3. `definePartition` copies own mapping entries and snapshots collection membership.
4. Copied mappings, diagram records, and the partition shell are frozen and returned.
5. Authors maintain immutable state behind the exported references. Publication does not change that state.

## Model-state responsibility

Publication does not traverse element data, edge endpoints, or definition guards.
There is no payload whitelist or recursive preflight. Existing aliases are untouched.
Authors use readonly fields, immutable collections, and suitable model APIs to maintain
immutable shared model state. `defineElement` retains its shallow-freeze semantics.
Adjacency remains live; new edges do not change prior snapshots or partition membership.

## Hierarchy and local contributions

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
