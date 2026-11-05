# Governed Model Core

Governed Model Core is a small TypeScript library for model elements that can participate in graph traversal and deterministic diagram export.

## Quickstart

```ts
import { Edge, Node, exportDiagram, type GraphElement } from 'governed-model-core';

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

function exportContext(title: string, elements: readonly GraphElement[]): string {
  return exportDiagram(elements, `C4Context\ntitle ${title}`, '');
}

const api = new ServiceNode('SystemA', 'System A');
const db = new ServiceNode('SystemB', 'System B');
const read = new Relationship(api, db, 'REST');

const selection = [api, read, db];
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

## Features

- `Node` and `Edge` are extensible via subclassing and custom `toNotation()` methods.
- `Node.edges`, `Node.outgoing`, and `Node.incoming` expose direct graph traversal without mutating the model during read access.
- `exportDiagram()` renders nodes before edges and preserves the start and end text exactly as supplied.
- Repeated exports of the same selection are byte-identical.
- `saveDiagram()` writes the generated diagram to disk.

```ts
import { exportDiagram, saveDiagram, type GraphElement } from 'governed-model-core';

const elements: readonly GraphElement[] = [];
const diagram = exportDiagram(elements, 'C4Context\ntitle System Context diagram', '');

await saveDiagram(diagram, './system-context.mmd');
```
