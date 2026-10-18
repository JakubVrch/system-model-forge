import { describe, expectTypeOf, it } from 'vitest';

import { Edge } from '../../src/element/edge.js';
import { ModelElement } from '../../src/element/model-element.js';
import { Node } from '../../src/element/node.js';
import { exportDiagram, saveDiagram, type GraphElement } from '../../src/export/export-diagram.js';

describe('declarations', () => {
  it('matches the public contract', () => {
    const from = new Node();
    const to = new Node();
    const edge = new Edge(from, to);

    expectTypeOf<Edge['from']>().toEqualTypeOf<Node | undefined>();
    expectTypeOf<Node['edges']>().toEqualTypeOf<readonly Edge[]>();
    expectTypeOf<Node['outgoing']>().toEqualTypeOf<readonly Edge[]>();
    expectTypeOf<Node['incoming']>().toEqualTypeOf<readonly Edge[]>();
    expectTypeOf<GraphElement>().toEqualTypeOf<Node | Edge>();
    expectTypeOf(exportDiagram([edge, from])).toEqualTypeOf<string>();
    expectTypeOf(saveDiagram('diagram', './diagram.mmd')).toEqualTypeOf<Promise<void>>();

    // @ts-expect-error `from` is readonly
    edge.from = from;

    // @ts-expect-error arrays are readonly
    from.edges.push(new Edge(from, to));

    // @ts-expect-error abstract class cannot be constructed
    new ModelElement();
  });
});
