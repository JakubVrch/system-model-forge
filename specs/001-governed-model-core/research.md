# Research: Extensible Graph Core

## TypeScript runtime and module format

### Decision

Use the repository's TypeScript/Node.js 24 development baseline and native
ESM. Keep the initial implementation as a focused core library.

### Rationale

The constitution requires a TypeScript core, and the existing development
container targets Node.js 24. Native modules and classes give authors direct
access to ordinary inheritance and array operations.

### Alternatives considered

CommonJS or a second module format would add packaging work without a consumer
requirement. A custom DSL would duplicate TypeScript's class and module system.

## Package management

### Decision

Use Yarn for the single root library package. Create the package manifest and
lockfile with implementation work; do not create workspace scaffolding for this
feature.

### Rationale

Yarn is the package manager identified by the existing project planning
baseline. A single package is sufficient for the bounded core API; partition
and model packages are follow-on scope.

### Alternatives considered

An npm workspace or a Yarn workspace would add project structure not required
for this core-only feature. The repository currently has no package manifest or
lockfile, so there is no installed project tooling to preserve.

## Tolerant element creation

### Decision

Make construction lenient. An edge endpoint is a `Node` or `undefined`, and
`undefined` is a valid value meaning the node is missing. Constructors never
throw for missing endpoints. `undefined` endpoints register
with no node and are not patched later.

### Rationale

Bulk imports routinely deliver edges before, or without, their nodes. Failing
construction would make such data unusable and hide it from debugging. Keeping
the gap representable lets a later validation feature find and report it, while
traversal and export still work on what exists. Plain `undefined` is the
simplest representation, needs no extra type, and invents no nodes.

### Alternatives considered

Throwing on a missing endpoint is simple but blocks partial imports. Loose ID
strings or an `UnresolvedNode` placeholder add a second endpoint type and
ID-resolution semantics this feature does not need, and elements carry no IDs. Auto-creating a stub `Node` would invent elements and pollute selections
and exports.

## Node-to-edge traversal

### Decision

Keep direct `from` and `to` references on each `Edge`. Register each constructed
edge with its endpoint nodes in private node-owned state, and expose it as
`Node.edges`, a getter returning a frozen array of references to the existing
edge objects, with `Node.outgoing` (node is `from`) and `Node.incoming` (node is
`to`) making direction explicit. Callers filter further with native
`filter()`. Preserve separate edge objects when multiple edges share endpoints;
a self-loop is listed once in `edges`.

### Rationale

The required traversal is one hop from an already-held `Node` or `Edge`, not a
multi-hop query. Direct references serve the author-facing scenario without
a graph wrapper or a scan of a separate complete array, and explicit
`outgoing`/`incoming` arrays make direction clear while native `filter()`
covers any other selection. Private registration prevents callers from
editing the collection; reads do not mutate it.

An edge created after a node becomes visible through that node's `edges`. This
registration is construction-time graph assembly; the collection is never
exposed for mutation. Shared partition publication and cross-package
immutability enforcement belong to the separate partition feature.

### Alternatives considered

- A separate adjacency index requires callers to retain and consult another
  graph object for the specified direct traversal and duplicates information
  already available from edge endpoints.
- Searching the caller's full array is ordinary and useful for selection, but
  makes node traversal depend on callers supplying a complete edge collection
  and is distinct from the direct traversal scenario.
- A mutable public edge array would allow callers to corrupt adjacency and is
  rejected.

## Runtime graph dependency

### Decision

Add no graph dependency. Use native TypeScript objects and private `Set`/array
state for adjacency, and ordinary array operations for diagram selection and
export.

### Rationale

Parallel-edge identity, cycles, and immediate adjacency require no multi-hop
algorithms. A dependency such as Graphology would introduce a second graph
representation and adapter work without covering a requirement of this
feature.

### Alternatives considered

Graphology, Graphlib, and Cytoscape.js would be appropriate if this feature
included multi-hop traversal, graph algorithms, or partition assembly.
Those capabilities are excluded or belong to follow-on work.

## Notation and deterministic diagram export

### Decision

Give core nodes and edges readable default notation through an overridable
instance method. Export exactly the caller-supplied element array as a framed
text diagram; format each element once and order fragments deterministically
using code-unit string ordering. Edge notation retains both endpoint notations
even when an endpoint node was not selected. Custom notation implementations
must be deterministic for identical instances.

### Rationale

The overridable method lets subclasses provide domain-specific notation without
a separate notation registry. Sorting rendered fragments makes output
independent of array insertion order, while rendering the selection directly
ensures omitted endpoint nodes are not silently added. An explicit document
frame also makes an empty selection a valid diagram.

### Alternatives considered

A registry and per-notation renderer maps would require partition governance,
which is out of scope. Input-order output is simpler but makes equivalent
selections sensitive to the order in which arrays were assembled.

## Validation toolchain

### Decision

Use TypeScript strict checking and Vitest for unit, type, and integration
coverage, consistent with the existing project planning baseline. Test
specialization, edge registration, traversal, filtering with native arrays,
and byte-identical diagram exports across 100 repeated runs.

### Rationale

Compiler checking validates the subclassing and readonly declaration surface;
Vitest covers behavior and exact diagram strings. No extra graph or filtering
tool is warranted.

### Alternatives considered

An additional type-test framework or custom test harness would duplicate
TypeScript and Vitest capabilities for this initial API.
