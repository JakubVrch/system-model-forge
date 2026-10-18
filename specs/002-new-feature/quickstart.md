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

## Export a model from separate files

For example, keep your model elements in one module, your reusable export
function in another, and a small entry script that calls the function:

```text
scripts/
  model-elements.mjs
  export-context.mjs
  run-export.mjs
```

In `scripts/model-elements.mjs`, define and export the elements you are
currently working on. Their `toNotation()` methods own the model-specific
diagram syntax:

```js
import { Edge, Node } from '../dist/index.js';

class Service extends Node {
  constructor(id, name) {
    super();
    this.id = id;
    this.name = name;
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

export const elements = [
  systemA,
  systemB,
  new Relationship(systemA, systemB, 'REST'),
];
```

In `scripts/export-context.mjs`, define the author-owned operation. It chooses
the title and destination, passes the supplied element array to
`exportDiagram()`, and awaits `saveDiagram()`:

```js
import { exportDiagram, saveDiagram } from '../dist/index.js';

export async function exportContext(title, elements, destination) {
  const diagram = exportDiagram(elements, `C4Context\ntitle ${title}`, '');
  await saveDiagram(diagram, destination);
}
```

In `scripts/run-export.mjs`, load your current array and call that function:

```js
import { elements } from './model-elements.mjs';
import { exportContext } from './export-context.mjs';

await exportContext(
  'System Context diagram',
  elements,
  './system-context.mmd',
);
```

Build the library, then run your entry script with Node:

```bash
yarn build
node ./scripts/run-export.mjs
```

The generated `system-context.mmd` contains the exact Mermaid C4 text shown
above. There is no framework-provided export command: `node` runs your script,
your script loads the model elements and calls your export function, and the
function delegates text generation and file writing to the library. Since the
script awaits the function without swallowing errors, model-loading and
file-writing failures make the Node process exit unsuccessfully.

## Related design references

- [data-model.md](data-model.md)
- [contracts/diagram-export-contract.md](contracts/diagram-export-contract.md)
