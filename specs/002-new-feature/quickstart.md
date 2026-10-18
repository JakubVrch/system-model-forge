# Quickstart Validation Guide

## Prerequisites

- Node.js 24 LTS and Yarn
- Dependencies installed from the repository root

Run the focused checks:

```bash
yarn typecheck
yarn test tests/unit/export-diagram.test.ts tests/integration/quickstart.test.ts
```

Expected: strict TypeScript checking and the exporter and quickstart tests pass.

## Validate a Mermaid C4 System Context export

Define a `service` node type and a relationship edge type in the author's
metamodel. Each service element has a unique `id` and a `name`. The node
notation returns `System(${id}, "${name}")`; the relationship has a `name`
and its notation uses the endpoint IDs to return
`Rel(${from.id}, ${to.id}, "${name}")`. Together these notations produce
Mermaid C4 syntax.

`exportDiagram()` does not receive notation callbacks and does not prepend
framework labels. It calls `toNotation()` on each selected element, places
nodes before edges, preserves source order within both groups, and takes the
start and end text as direct parameters.

An author-owned function accepts a title and supplies the two header rows as
its start text:

```ts
function exportContext(title: string, elements: readonly GraphElement[]): string {
  return exportDiagram(elements, `C4Context\ntitle ${title}`, '');
}
```

The integration test uses two service elements with different IDs and names
and one relationship named `REST`. It verifies this output and checks that
100 repeated exports are identical:

```text
C4Context
title System Context diagram
System(SystemA, "System A")
System(SystemB, "System B")
Rel(SystemA, SystemB, "REST")
```

## Validate file output

Build the library, then invoke an author-written export function with Node.js.
The function passes the completed text—not elements or formatter options—to
`saveDiagram()`:

```bash
yarn build
node --input-type=module <<'EOF'
import { Edge, Node, exportDiagram, saveDiagram } from './dist/index.js';

function exportContext(title, elements) {
  return exportDiagram(elements, `C4Context\ntitle ${title}`, '');
}

class Service extends Node {
  constructor(id, name) {
    super();
    Object.assign(this, { id, name });
  }

  toNotation() {
    return `System(${this.id}, "${this.name}")`;
  }
}

class Relationship extends Edge {
  constructor(from, to, name) {
    super(from, to);
    this.name = name;
  }

  toNotation() {
    return `Rel(${this.from.id}, ${this.to.id}, "${this.name}")`;
  }
}

const systemA = new Service('SystemA', 'System A');
const systemB = new Service('SystemB', 'System B');
const diagram = exportContext(
  'System Context diagram',
  [systemA, systemB, new Relationship(systemA, systemB, 'REST')],
);
await saveDiagram(diagram, './system-context.mmd');
EOF
```

Expected: `system-context.mmd` contains the exact generated Mermaid C4 text. `saveDiagram()`
rejects on file creation or write errors, so an awaited call in the
author-written function causes the host CLI invocation to fail rather than
reporting success.

## Validate the author-written CLI workflow

Place the model-loading and export code in an author-owned script and run it
using the host runtime, for example:

```bash
node ./scripts/export-model.mjs
```

The framework provides no separate export command. The author script controls
model loading, selects the elements, calls `exportDiagram()`, then awaits
`saveDiagram(diagram, destination)`. Model-loading errors and file-writing
errors should be allowed to propagate so Node exits unsuccessfully.

## Related design references

- [data-model.md](data-model.md)
- [contracts/diagram-export-contract.md](contracts/diagram-export-contract.md)
