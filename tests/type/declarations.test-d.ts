import type { GraphElement as ElementGraphElement } from '@core/element/graph-element';
import type { GraphElement as PublicGraphElement } from '@core';
import { connectedNodes, cleanSelection, readonlySet } from '@core';
import { describe, expectTypeOf, it } from 'vitest';

import { Edge } from '@core/element/edge';
import { ModelElement } from '@core/element/model-element';
import { Node } from '@core/element/node';
import { exportDiagram, saveDiagram, type GraphElement } from '@core/export/export-diagram';

describe('declarations', () => {
  it('matches the public contract', () => {
    const from = new Node('node', 'Node');
    const to = new Node('node', 'Node');
    const edge = new Edge(from, to, 'relationship', 'Relationship');

    expectTypeOf<ConstructorParameters<typeof Node>>().toEqualTypeOf<[id: string, name: string]>();
    expectTypeOf<ModelElement['name']>().toEqualTypeOf<string>();
    // @ts-expect-error name is readonly
    from.name = 'Changed';

    expectTypeOf<Edge['from']>().toEqualTypeOf<Node | undefined>();
    expectTypeOf<Node['edges']>().toEqualTypeOf<ReadonlySet<Edge>>();
    expectTypeOf<Node['outgoing']>().toEqualTypeOf<ReadonlySet<Edge>>();
    expectTypeOf<Node['incoming']>().toEqualTypeOf<ReadonlySet<Edge>>();
    expectTypeOf<GraphElement>().toEqualTypeOf<Node | Edge>();
    expectTypeOf<ElementGraphElement>().toEqualTypeOf<GraphElement>();
    expectTypeOf<PublicGraphElement>().toEqualTypeOf<ElementGraphElement>();
    expectTypeOf(exportDiagram([edge, from])).toEqualTypeOf<string>();
    expectTypeOf(saveDiagram('diagram', './diagram.mmd')).toEqualTypeOf<Promise<void>>();

    // @ts-expect-error `from` is readonly
    edge.from = from;

    // @ts-expect-error sets are readonly
    from.edges.add(new Edge(from, to, 'relationship', 'Relationship'));

    // @ts-expect-error abstract class cannot be constructed
    new ModelElement();
  });
});

 it('types direction-aware queries', () => {
   const nodes: ReadonlySet<Node> = new Set([new Node('node', 'Node')]);
   for (const direction of ['outgoing', 'incoming', 'both'] as const) {
     expectTypeOf(connectedNodes(nodes, edge => { expectTypeOf(edge).toEqualTypeOf<Edge>(); return true; }, direction)).toEqualTypeOf<ReadonlySet<Node>>();
   }
   // @ts-expect-error start arrays do not guarantee uniqueness
   connectedNodes([new Node('node', 'Node')], () => true, 'both');
   // @ts-expect-error direction required
   connectedNodes(nodes, () => true);
   // @ts-expect-error unsupported direction
   connectedNodes(nodes, () => true, 'sideways');
   // @ts-expect-error edges are not starting nodes
   connectedNodes(new Set([new Edge(undefined, undefined, 'relationship', 'Relationship')]), () => true, 'both');
 });

 it('types readonly selection cleanup', () => {
   const selection: ReadonlySet<GraphElement> = new Set([new Node('node', 'Node')]);
   // @ts-expect-error selection arrays do not guarantee uniqueness
   cleanSelection([new Node('node', 'Node')]);
   expectTypeOf(cleanSelection(selection)).toEqualTypeOf<ReadonlySet<GraphElement>>();
 });

it('types protected sets and iterable exports', () => {
  const elements = readonlySet<GraphElement>([new Node('node', 'Node')]);
  expectTypeOf(elements).toEqualTypeOf<ReadonlySet<GraphElement>>();
  expectTypeOf(exportDiagram(elements)).toEqualTypeOf<string>();
  // @ts-expect-error mutation is not exposed
  elements.clear();
});
