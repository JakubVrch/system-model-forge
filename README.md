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

## Features

- `defineElement()` exposes typed creation and an `.is` type guard for a model class. It shallow-freezes each instance after construction and freezes the callable definition.
- `Node` and `Edge` are extensible via subclassing and custom `toNotation()` methods.
- `Node.edges`, `Node.outgoing`, and `Node.incoming` return runtime-protected ReadonlySet snapshots in registration order.
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

## Integration example

The microservice environment fixture has separate infrastructure and service modules, with a shared metamodel index. Its relationship definitions are `databaseUsage`, `eventFlow`, and `moduleComposition`. Tests and fixtures use `@core`, `@metamodel`, and `@fixtures/*` aliases configured in TypeScript and Vitest. These development aliases are not required by built core modules.

`tests/integration/quickstart.test.ts` demonstrates importing the fixture exports and checking their basic contents. Detailed model/export acceptance and metamodel contracts live in their own integration test files.

Relative imports in TypeScript source name `.ts` files directly. The compiler's `rewriteRelativeImportExtensions` option rewrites runtime imports to `.js` during build, so the emitted ESM runs directly in Node.js.

## Development checks

Run `npm run typecheck`, `npm test`, and `npm run build` to validate the library.
Run `npm run knip` to check for unused files, exports, and dependencies. Knip treats
`src/index.ts` as the public library entry point and includes the declaration tests
as entry points alongside the runtime tests discovered through Vitest.
