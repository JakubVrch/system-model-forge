# Governed Model Core

Governed Model Core is a small TypeScript library for model elements that can participate in graph traversal and deterministic diagram export.

## Quickstart

```ts
import { Edge, Node, defineElement, exportDiagram, readonlySet, filterSet, unionSet, type GraphElement } from 'governed-model-core';

class ServiceNode extends Node {
  public constructor(
    public readonly id: string,
    public readonly name: string,
  ) {
    super(id);
  }

  public override toNotation(): string {
    return `System(${this.id}, "${this.name}")`;
  }
}

class Relationship extends Edge {
  public constructor(
    from: Node,
    to: Node,
    public readonly name: string,
    id: string,
  ) {
    super(from, to, id);
  }

  public override toNotation(): string {
    const from = this.from as ServiceNode | undefined;
    const to = this.to as ServiceNode | undefined;

    return `Rel(${from?.id}, ${to?.id}, "${this.name}")`;
  }
}

function exportContext(title: string, elements: Iterable<GraphElement>): string {
  return exportDiagram(elements, `C4Context\ntitle ${title}`, '');
}

const service = defineElement(ServiceNode);
const relationship = defineElement(Relationship);

const api = service('SystemA', 'System A');
const db = service('SystemB', 'System B');
const read = relationship(api, db, 'REST', 'api-db');

const selection = readonlySet([api, read, db]);
console.log(exportContext('System Context diagram', selection));
```

This produces:

```text
C4Context
title System Context diagram
System(SystemA, "System A")
System(SystemB, "System B")
Rel(SystemA, SystemB, "REST")
```

## Metamodel definitions

A metamodel module can hide its implementation class and export its type plus a callable definition:

```ts
export const service = defineElement(ServiceNode);
export type { ServiceNode };
```

Every constructor argument is preserved, including domain properties, optional values, defaults, and rest arguments. For example, an event definition can accept `event(serviceNode, topicNode, 'event-id', 'publish')`; every element requires an author-assigned string `id`; business fields remain author-defined.

Use the generated predicate directly in queries:

```ts
const services = filterSet(selection, service.is);
```

The guard uses `instanceof`, so subclasses match too. Recognition does not freeze existing objects. Creation freezes only the new instance's own properties; nested values and referenced endpoints retain their original identities and mutability. Keep shared metamodel fields readonly and protect nested collections explicitly where needed.

### Typed relationship endpoints

`Edge<From, To>` preserves the node types of `from` and `to`. Both default to
`Node`, so existing `Edge` subclasses remain valid. The exported `Endpoint<T>`
type centralizes the allowance for `undefined`; use it in subclass constructors
that accept missing references. Endpoint properties remain readonly, and normal
adjacency and query behavior is unchanged.

```ts
import { Edge, type Endpoint } from 'governed-model-core';

// ServiceNode and DatabaseNode are authored Node subclasses with IDs.
class DatabaseUsage extends Edge<ServiceNode, DatabaseNode> {
  constructor(
    from: Endpoint<ServiceNode>,
    to: Endpoint<DatabaseNode>,
    id: string,
    public readonly label = 'uses',
  ) {
    super(from, to, id);
  }

  override toNotation(): string {
    return `Rel(${this.from?.id}, ${this.to?.id}, "${this.label}")`;
  }
}
```

Endpoint types are also inferred by `new Edge(service, database, 'relationship')`. Missing references
remain `undefined`; this type does not resolve IDs.
Use `cleanSelection` before rendering when dangling relationships should be omitted.

## Features

- `defineElement()` exposes typed creation and an `.is` type guard for a model class. It shallow-freezes each instance after construction and freezes the callable definition.
- `Node` and `Edge` are extensible via subclassing and custom `toNotation()` methods.
- `Node.edges`, `Node.outgoing`, and `Node.incoming` return runtime-protected ReadonlySet snapshots in registration order.
- `findById(set, id)` returns the first element with a strictly matching authored ID, or `undefined`. It preserves object identity and scans in iteration order without copying the set. Members must declare an `id`; its type is preserved. Duplicate IDs return the first match.
- `filterSet()` filters a readonly set into a protected snapshot and preserves type-guard narrowing.
- `unionSet()` combines iterable collections into a protected set, inferring their combined element type and preserving first-occurrence order.
- `readonlySet()` creates identity-unique, insertion-ordered snapshots with runtime mutation protection.
- `connectedNodes()` follows one filtered hop in outgoing, incoming, or both directions; `cleanSelection()` removes edges with absent endpoints. Both accept and return readonly sets.
- `exportDiagram()` accepts any iterable of graph elements, renders nodes before edges and preserves the start and end text exactly as supplied.
- Repeated exports of the same selection are byte-identical.
- `saveDiagram()` writes the generated diagram to disk.

```ts
import { exportDiagram, saveDiagram, readonlySet, type GraphElement } from 'governed-model-core';

const elements: Iterable<GraphElement> = [];
const diagram = exportDiagram(elements, 'C4Context\ntitle System Context diagram', '');

await saveDiagram(diagram, './system-context.mmd');
```

## Model partitions

`definePartition({ id, name, elements?, diagrams?, metamodel? })` publishes named
immutable sets, diagram records (`{ data, inNotation, fileExtension }`), and callable definitions.
Exact keys, element identities, set order, definition signatures, and supplied text
are preserved. Native `Set` inputs are accepted; published sets are readonly.

A partition entry makes the contributions it maintains discoverable to authors and
the CLI for model exploration and builds. It describes a
maintenance boundary; it does not assemble or re-export its entire subtree.

The following conventions apply to model authoring:

| Concern | Convention |
| --- | --- |
| Entry file | One `[name].partition.ts` per partition folder, exporting a named `partition`. |
| Hierarchy | The folder tree is the sole source of truth. The parent is the nearest ancestor folder containing a partition entry. No separate `children` registry. Intermediate organizational folders need no declaration. |
| Supporting code | Prefix support **folders** with `_`, such as `_metamodel/`, `_elements/`, `_diagrams/`, or `_shared/`. These folders are excluded from CLI hierarchy discovery. Files have no prefix. |
| File size | Start with ordinary files such as `elements.ts` and `diagrams.ts`; expand into support folders when useful. Empty categories need no files or directories. |
| Ownership | Publish only contributions the partition itself maintains. Importing vocabulary or containing a child does not justify republishing its contributions. A locally maintained selection or diagram may reference foreign elements. |
| Optional contributions | `id` and `name` are required. `elements`, `diagrams`, and `metamodel` are independently optional; omitted groups become empty immutable mappings. Identity-only and vocabulary-only partitions are valid. |
| Element collections | Author elements and relationships as named object exports, then collect them into one readonly set for publication. Usually publish one named set containing multiple elements. Add more named sets only for meaningful selections; do not create a singleton set per element just to expose individual references. |
| Cross-partition imports | Always import through the owning `[name].partition.ts`, including metamodel definitions and types. Do not import another partition's internal files or expose individual instances as an alternative to its published sets. |
| Element lookup | Retrieve foreign elements from published sets by domain ID. A missing match returns `undefined`, which relationship definitions should accept as a missing endpoint. Clean diagram selections with `cleanSelection` when incomplete relationships should be omitted. Every element has an author-assigned string ID; core provides no uniqueness registry. |
| Local references | Use named variables pointing to objects when constructing local relationships. Avoid positional references such as `moduleInstances[0]`. |
| Internal imports | Files within the same partition may import its own modules directly. Avoid importing their own partition entry, which assembles those modules and could introduce a cycle. |
| Metamodel placement | Ownership may flow top-down, bottom-up, across branches, or in a mixture. Hierarchy neither supplies automatic metamodel inheritance nor dictates dependency direction. Keep module dependencies acyclic. |

These are authoring conventions, not ownership or filesystem checks performed by
core. The CLI discovers entries and builds published diagrams. Publication and
parent/child delegation contracts remain outside its scope.

The complete fixture layout:

```text
microservice-environment/
├── microservice-environment.partition.ts
├── topics/
│   ├── topics.partition.ts
│   ├── _metamodel/topic-node.ts
│   └── elements.ts
├── databases/
│   ├── databases.partition.ts
│   ├── _metamodel/database-node.ts
│   └── elements.ts
└── services/
    ├── services.partition.ts
    ├── _metamodel/
    │   ├── index.ts
    │   ├── service-node.ts
    │   ├── module-node.ts
    │   ├── module-composition.ts
    │   ├── event-flow.ts
    │   └── database-usage.ts
    ├── service-a/
    │   ├── service-a.partition.ts
    │   ├── elements.ts
    │   └── diagrams.ts
    └── service-b/
        ├── service-b.partition.ts
        ├── elements.ts
        └── diagrams.ts
```

The root declares identity only. Topics and databases publish their own vocabulary
and instance selections. Services publishes shared vocabulary; Service A/B publish
only their own elements and diagrams. Their use of services vocabulary does not
republish it. Topics and databases each publish one named collection. Consumers
import partition entries and retrieve individual instances by ID from those sets.
Instance declarations stay internal; no singleton wrappers are needed.

A partition publishes a collection while keeping individual declarations internal:

```ts
// topics/elements.ts
import { readonlySet } from 'governed-model-core';
import { topic } from './_metamodel/topic-node.ts';

const sharedTopic = topic('shared', 'Shared topic');
const topicA = topic('topicA', 'Topic A');
export const topics = readonlySet([sharedTopic, topicA]);
```

```ts
// topics/topics.partition.ts
import { definePartition } from 'governed-model-core';
import { topics } from './elements.ts';
import { topic } from './_metamodel/topic-node.ts';

export const partition = definePartition({
  id: 'topics',
  name: 'Topics',
  elements: { topics },
  metamodel: { topic },
});
```

A service uses the partition boundary, looks up a foreign element by ID, and uses
named object references for its own elements:

```ts
// services/service-a/elements.ts (abbreviated)
import { readonlySet, findById } from 'governed-model-core';
import { partition as topics } from '../../topics/topics.partition.ts';
import { partition as services } from '../services.partition.ts';

const { service, module, moduleComposition, eventFlow } = services.metamodel;
const sharedTopic = findById(topics.elements.topics, 'shared');

const serviceA = service('serviceA', 'Service A');
const moduleA1 = module('moduleA1', 'Module A1');
const contains = moduleComposition(serviceA, moduleA1, 'moduleComposition');
const publishes = eventFlow(serviceA, sharedTopic, 'event-flow', 'publish');
export const localModel = readonlySet([serviceA, moduleA1, contains, publishes]);
```

This lookup retains the published object's identity; it does not reconstruct an
element with the same ID. Collection iteration order is preserved for rendering,
but positions are not used to identify relationship endpoints.

For example, from beside the fixture folder:

```ts
import { partition as services } from './microservice-environment/services/services.partition.ts';
import { partition as serviceA } from './microservice-environment/services/service-a/service-a.partition.ts';
import { saveDiagram } from 'governed-model-core';

const newService = services.metamodel.service('new-service', 'New service');
const localModel = serviceA.elements.localModel;
await saveDiagram(serviceA.diagrams.eventOverview.inNotation, './service-a.mmd');
```

Child authoring imports `../services.partition.ts` for vocabulary. That partition
does not import its children, so this introduces no cycle. Infrastructure definitions
and instances are accessed through their owning topics/databases partition entries.
Parents do not forward these contributions merely to make them reachable.

### Publication protection

Publication copies and freezes its mappings, diagram records, and shell, and
snapshots set membership. Elements, endpoints, definitions, and guards retain their
original references and state. Publishing or aggregating a partition does not
recursively inspect or freeze them, invoke their getters, or restrict their payload types.

Authors maintain immutable model state using readonly fields, immutable collections,
and appropriate model APIs. `defineElement` keeps its existing shallow-freeze behavior;
publication adds no deeper enforcement. The framework protects publication structure,
while model authors are responsible for the state behind the exported references.

Graph adjacency remains live: constructing a later edge to a published node changes
a fresh adjacency read. Prior adjacency snapshots and partition membership remain
unchanged. Diagram text is supplied by the author and is never regenerated or checked
for equivalence automatically.

`tests/integration/microservice-environment.test.ts` verifies all six partitions,
local publication boundaries, shared vocabulary and infrastructure references,
and exact diagram output and saved text. Publication protection is covered by unit tests. See the [validation guide](specs/004-define-model-partitions/quickstart.md)
for runnable commands. Fixtures use the development `@core` alias configured in
TypeScript and Vitest; built core modules do not need that alias. Relative source
imports name `.ts` files; the compiler rewrites them to `.js` during build.

## Development checks

Run `npm run typecheck`, `npm test`, and `npm run build` to validate the library.
Run `npm run knip` to check for unused files, exports, and dependencies. Knip treats
`src/core/index.ts` as the public library entry point and includes the declaration tests
as entry points alongside the runtime tests discovered through Vitest.

### Authoring compatibility

Nodes now require `Node(id)` and edges require `Edge(from, to, id)`. Custom constructors forward author-assigned IDs; duplicate IDs remain allowed. Every diagram requires an explicit `fileExtension` (for example `.mmd`), preserved alongside its exact text and membership. These are breaking authoring changes; no release version is selected here.

`getElementInfo()` returns a fresh readonly snapshot of supported own enumerable data fields (strings, finite numbers, null, undefined), excluding identity and framework state. It skips getters and richer values. Override it to compute or rename business attributes. Store internal state in `#private` or non-enumerable fields: ordinary TypeScript-private fields are still enumerable at runtime.


## CLI workflow

Use Node >=24 and `yarn install --frozen-lockfile`, then `npm run build`.
The package includes the `model-forge` executable; in this checkout use
`node dist/cli/main.js`. The package remains private and is not published.

```bash
node dist/cli/main.js --help
node dist/cli/main.js partition-info --root tests/integration/fixtures/microservice-environment
node dist/cli/main.js list-elements --root tests/integration/fixtures/microservice-environment --partition-id service-a --elements localModel --property name --limit 2 --format json
node dist/cli/main.js build --root tests/integration/fixtures/microservice-environment --out .tmp/cli-diagrams --dry-run
node dist/cli/main.js build --root tests/integration/fixtures/microservice-environment --out .tmp/cli-diagrams --format json
```

The inventory reports six partitions, their nearest ancestor, and all export keys
with node/edge counts and diagram extensions. Inspection preserves separate export
memberships. The build writes the two published `eventOverview.mmd` files beneath
`services/service-a/` and `services/service-b/` in the destination.

| Option | Applies to | Meaning |
| --- | --- | --- |
| `--root <directory>` | All commands | Discovery root; defaults to current directory. |
| `--partition-id <id>` | All commands | Repeatable exact, case-sensitive ID. |
| `--partition-name <name>` | All commands | Repeatable exact, case-sensitive name; duplicate names select all matches. |
| `--path <glob>` | All commands | Repeatable whole entry-path pattern relative to root, using `/`. |
| `--format pretty\|json` | All commands | Default `pretty`; `json` produces one result document. |
| `--tsconfig <file>` | All commands | Explicit config; otherwise nearest config upward from root. |
| `--elements <key>` | `list-elements` | Repeatable element-export key. |
| `--diagram <key>` | `list-elements` | Repeatable diagram-export key. |
| `--property <name>` | `list-elements` | Repeatable business attribute projection; metadata stays visible. |
| `--limit <positive integer>` | `list-elements` | Limit each node and edge group independently; retain total/returned/omitted counts. |
| `--out <directory>` | `build` | Required destination, resolved from current directory. |
| `--dry-run` | `build` | Validate and show planned files; write no tool-managed files or caches. |
| `--help`, `-h`, `--version` | Top level or commands | Help/version without evaluating model sources; supports JSON. |

Both `--option value` and `--option=value` work. Root, output, and config paths
resolve from the caller's directory. Unknown flags, repeated singleton options,
unexpected positional arguments, and invalid limits fail.

Repeated selectors of one kind form a union; ID, name, and path groups intersect.
Each explicit value must match a candidate, and the final intersection must be
nonempty. A parent match does not include descendants. For example:

```bash
model-forge partition-info --root models --partition-name 'Service A' --partition-name 'Service B'
model-forge list-elements --root models --path 'services/**/*.partition.ts' --partition-id service-a --diagram eventOverview
```

Quote globs: `*` and `?` match within a segment, and whole-segment `**` matches
across directories. Absolute paths, traversal, backslashes, brackets, braces, and
extglobs are rejected. ID/name selectors are literal, even with glob characters.
Path filtering precedes loading, so it can exclude unrelated broken sources;
ID/name filtering loads all path candidates first. Ordinary imports still execute.
Discovery skips support folders beginning `_`, hidden folders, dependencies,
symlinks, and the build destination. Multiple candidate entries in one folder or
duplicate loaded partition IDs fail. An empty tree without selectors succeeds.

Without export filters, inspection lists all element and diagram exports.
`--elements` and `--diagram` form a union across their separate groups; each key
must occur in at least one selected partition. Empty exports remain visible.
Properties are validated against full membership before limiting. Endpoints retain
identity and full-export membership even when their records are omitted by a limit.
The CLI never expands adjacency or merges distinct objects with equal IDs.

### Results and automation

Commands exit 0 on success and 1 on handled failure. Pretty output uses plain
inventories, separate node/edge tables, or a build summary. JSON stdout contains
exactly one schemaVersion 1 document followed by a newline:

```json
{"schemaVersion":1,"command":"partition-info","success":true,"data":{"partitions":[]},"error":null}
```

Failures have `success:false`, a contextual `error` with `message` and `context`,
and `data:null`, except write failures retain a truthful partial build summary.
Inventory data contains `partitions`; inspection contains `selections` with
provenance and node/edge groups. Items separate `identity`, `attributes`,
`modelType`, and response-local `ref`; edges additionally describe endpoints.
Refs distinguish object identity and are not stable domain IDs. JSON preserves
strings, finite numbers, and null; explicit undefined becomes null while absent
keys stay omitted. See the [complete output contract](specs/005-cli-tool/contracts/output-contract.md).
Source stdout/stderr is forwarded to stderr; diagnostics do not contaminate JSON.
No prompts, colors, or default stack traces are emitted.

### Build and source execution

Build writes exact published text to `<out>/<source-folder>/<key><fileExtension>`.
All selected diagrams and destinations are validated before writes, including
containment, source-entry protection, and symlink checks. Output must differ from
the source root. Empty text creates an empty file; extensions may be multipart.
Writes are unconditional, ordered by source path then diagram key. For collisions,
the last write wins and the distinct successful destination counts once. No stale
files are deleted. The first write failure stops the build without rollback;
its summary lists only completed diagram keys and successful file count.
Dry-run additionally reports `artifacts` and `plannedFiles`, with zero exported files.

Sources are trusted executable TypeScript, loaded with tsx in one child process
per invocation so shared graph identity is preserved. This is not a sandbox.
Dry-run prevents CLI-managed writes but cannot prevent authored side effects.
Run typechecking separately; source execution does not typecheck the model.

### Custom business fields and migration

Forward explicit IDs through custom constructors: `super(id)` for nodes and
`super(from, to, id)` for edges. The edge ID is the third base-constructor argument;
existing endpoint positions are unchanged. No IDs are generated. Add
`fileExtension: '.mmd'` (or the authored format) to every published diagram:

```ts
const diagrams = {
  overview: { data: selection, inNotation: exportContext('Overview', selection), fileExtension: '.mmd' },
};
```

Stored business fields need no registration. To omit internal fields or convert
richer values, override the synchronous, pure `getElementInfo()` method:

```ts
class Service extends Node {
  #internal = 'hidden';
  constructor(id: string, readonly name: string, readonly tags: readonly string[]) {
    super(id);
  }
  override getElementInfo() {
    return { name: this.name, tags: this.tags.join(', ') };
  }
}
```

Overrides replace the default record and must return flat data containing only
strings, finite numbers, null, or undefined. Invalid values, returned accessors,
and thrown methods fail inspection. The default skips unsupported values without
reading getters, symbols, non-enumerable fields, or runtime-private fields.
Ordinary TypeScript `private`/`protected` fields may be enumerable and thus visible;
use runtime-private storage or an override to hide them.

Required IDs and diagram extensions are breaking public authoring changes. Package
root imports remain unchanged after the move to `dist/core/`. Release versioning
and publication are deferred. See the [CLI validation walkthrough](specs/005-cli-tool/quickstart.md).
