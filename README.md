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
    super();
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
  ) {
    super(from, to);
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
const read = relationship(api, db, 'REST');

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

Every constructor argument is preserved, including domain properties, optional values, defaults, and rest arguments. For example, an event definition can accept `event(serviceNode, topicNode, 'publish')`; core does not prescribe a fixed `id`/`name` schema.

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
    public readonly label = 'uses',
  ) {
    super(from, to);
  }

  override toNotation(): string {
    return `Rel(${this.from?.id}, ${this.to?.id}, "${this.label}")`;
  }
}
```

Endpoint types are also inferred by `new Edge(service, database)`. Missing references
remain `undefined`; this type does not resolve IDs or impose ID fields on nodes.
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
immutable sets, diagram records (`{ data, inNotation }`), and callable definitions.
Exact keys, element identities, set order, definition signatures, and supplied text
are preserved. Native `Set` inputs are accepted; published sets are readonly.

A partition entry makes the contributions it maintains discoverable to authors and
future tooling for model exploration, builds, and publication. It describes a
maintenance boundary; it does not assemble or re-export its entire subtree.

The following conventions apply to model authoring:

| Concern | Convention |
| --- | --- |
| Entry file | One `[name].partition.ts` per partition folder, exporting a named `partition`. |
| Hierarchy | The folder tree is the sole source of truth. The parent is the nearest ancestor folder containing a partition entry. No separate `children` registry. Intermediate organizational folders need no declaration. |
| Supporting code | Prefix support **folders** with `_`, such as `_metamodel/`, `_elements/`, `_diagrams/`, or `_shared/`. These folders are excluded from future hierarchy discovery. Files have no prefix. |
| File size | Start with ordinary files such as `elements.ts` and `diagrams.ts`; expand into support folders when useful. Empty categories need no files or directories. |
| Ownership | Publish only contributions the partition itself maintains. Importing vocabulary or containing a child does not justify republishing its contributions. A locally maintained selection or diagram may reference foreign elements. |
| Optional contributions | `id` and `name` are required. `elements`, `diagrams`, and `metamodel` are independently optional; omitted groups become empty immutable mappings. Identity-only and vocabulary-only partitions are valid. |
| Element collections | Author elements and relationships as named object exports, then collect them into one readonly set for publication. Usually publish one named set containing multiple elements. Add more named sets only for meaningful selections; do not create a singleton set per element just to expose individual references. |
| Cross-partition imports | Always import through the owning `[name].partition.ts`, including metamodel definitions and types. Do not import another partition's internal files or expose individual instances as an alternative to its published sets. |
| Element lookup | Retrieve foreign elements from published sets by domain ID. A missing match returns `undefined`, which relationship definitions should accept as a missing endpoint. Clean diagram selections with `cleanSelection` when incomplete relationships should be omitted. IDs belong to the authored metamodel; core provides no universal ID field or registry. |
| Local references | Use named variables pointing to objects when constructing local relationships. Avoid positional references such as `moduleInstances[0]`. |
| Internal imports | Files within the same partition may import its own modules directly. Avoid importing their own partition entry, which assembles those modules and could introduce a cycle. |
| Metamodel placement | Ownership may flow top-down, bottom-up, across branches, or in a mixture. Hierarchy neither supplies automatic metamodel inheritance nor dictates dependency direction. Keep module dependencies acyclic. |

These are authoring conventions, not ownership or filesystem checks performed by
core. CLI discovery/build/publish and delegation contracts are future work. A future
parent contract can describe required child contributions without duplicating the
folder hierarchy; no scanner or contract engine is implemented yet.

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
const contains = moduleComposition(serviceA, moduleA1);
const publishes = eventFlow(serviceA, sharedTopic, 'publish');
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
`src/index.ts` as the public library entry point and includes the declaration tests
as entry points alongside the runtime tests discovered through Vitest.
