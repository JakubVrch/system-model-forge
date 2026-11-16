import { describe, expect, it } from 'vitest';

import { getConnectedEdges, getIncomingEdges, getOutgoingEdges, registerIncoming, registerOutgoing } from '@core/element/adjacency';

describe('adjacency registration', () => {
  it('ignores repeated registration of the same edge', () => {
    const orders = {};
    const payments = {};
    const edge = { from: orders, to: payments };

    registerOutgoing(edge, orders);
    registerOutgoing(edge, orders);
    registerIncoming(edge, payments);
    registerIncoming(edge, payments);

    expect([...getOutgoingEdges(orders)]).toEqual([edge]);
    expect([...getIncomingEdges(payments)]).toEqual([edge]);
    expect([...getConnectedEdges(orders)]).toEqual([edge]);
    expect([...getConnectedEdges(payments)]).toEqual([edge]);
  });

  it('keeps two different edges even when their endpoints match', () => {
    const orders = {};
    const payments = {};
    const first = { from: orders, to: payments };
    const second = { from: orders, to: payments };

    registerOutgoing(first, orders);
    registerOutgoing(second, orders);
    registerIncoming(first, payments);
    registerIncoming(second, payments);

    // toBe checks the original objects, not just matching properties.
    const outgoing = [...getOutgoingEdges(orders)];
    expect(outgoing).toHaveLength(2);
    expect(outgoing[0]).toBe(first);
    expect(outgoing[1]).toBe(second);
    const incoming = [...getIncomingEdges(payments)];
    expect(incoming).toHaveLength(2);
    expect(incoming[0]).toBe(first);
    expect(incoming[1]).toBe(second);
  });
});
