# Governed Model Core

A small TypeScript library for extensible graph elements. It exposes `Node`, `Edge`, and a deterministic `exportDiagram()` function for text output.

```ts
import { Edge, Node, exportDiagram } from 'governed-model-core';

class ServiceNode extends Node {
  public override toNotation(): string {
    return 'service api(server)[API]';
  }
}

class ServiceEdge extends Edge {
  public override toNotation(): string {
    return 'api:R --> L:db';
  }
}

const api = new ServiceNode();
const db = new ServiceNode();
const request = new ServiceEdge(api, db);

console.log(exportDiagram([api, request]));
```

This package keeps direct traversal on `Node.edges`, `Node.outgoing`, and `Node.incoming`, and it preserves a stable export format across repeated runs.
