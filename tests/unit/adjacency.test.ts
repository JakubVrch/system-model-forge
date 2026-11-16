import { describe, expect, it } from 'vitest';

import {
  getConnectedEdges,
  getIncomingEdges,
  getOutgoingEdges,
  registerIncoming,
  registerOutgoing,
} from '@core/element/adjacency';

describe('adjacency', () => {
  it('tracks creation order and self-loops correctly', () => {
    const a = {} as object;
    const b = {} as object;

    const first = { from: a, to: b };
    const self = { from: a, to: a };
    const second = { from: b, to: a };

    registerOutgoing(first, a);
    registerIncoming(first, b);
    registerOutgoing(self, a);
    registerIncoming(self, a);
    registerOutgoing(second, b);
    registerIncoming(second, a);

    expect([...getOutgoingEdges(a)]).toEqual([first, self]);
    expect([...getIncomingEdges(a)]).toEqual([self, second]);
    expect([...getIncomingEdges(a)][0]).toBe(self);
    expect([...getIncomingEdges(a)][1]).toBe(second);
    expect([...getConnectedEdges(a)]).toEqual([first, self, second]);
    expect([...getConnectedEdges(a)]).toEqual([...getOutgoingEdges(a), ...[...getIncomingEdges(a)].filter((edge) => edge !== self)]);
    expect([...getConnectedEdges(a)]).toHaveLength(3);
  });

  it('registers each reference once while preserving distinct parallel edges', () => {
    const a = {}, b = {};
    const first = { from: a, to: b };
    const parallel = { from: a, to: b };
    const loop = { from: a, to: a };
    for (const edge of [first, parallel, first]) {
      registerOutgoing(edge, a);
      registerIncoming(edge, b);
    }
    for (let i = 0; i < 2; i++) {
      registerOutgoing(loop, a);
      registerIncoming(loop, a);
    }
    for (const [actual, expected] of [
      [getOutgoingEdges(a), [first, parallel, loop]],
      [getIncomingEdges(b), [first, parallel]],
      [getIncomingEdges(a), [loop]],
      [getConnectedEdges(a), [first, parallel, loop]],
    ] as const) {
      expect(actual.size).toBe(expected.length);
      expected.forEach((edge, index) => expect([...actual][index]).toBe(edge));
    }
  });

  it('returns frozen snapshots and rejects mutation', () => {
    const a = {} as object;
    const edge = { from: a, to: a };

    registerOutgoing(edge, a);
    const outgoing = getOutgoingEdges(a);
    const incoming = getIncomingEdges(a);
    const connected = getConnectedEdges(a);

    expect(Object.isFrozen(outgoing)).toBe(true);
    expect(Object.isFrozen(incoming)).toBe(true);
    expect(Object.isFrozen(connected)).toBe(true);

    expect(() => {
      (outgoing as Set<object>).add({});
    }).toThrow();

    expect(() => {
      (incoming as Set<object>).add({});
    }).toThrow();

    expect(() => {
      (connected as Set<object>).add({});
    }).toThrow();
  });

  it('returns empty sets for unknown nodes and preserves snapshot stability', () => {
    const unknown = {} as object;
    const a = {} as object;
    const edge = { from: a, to: unknown };

    expect([...getOutgoingEdges(unknown)]).toEqual([]);
    expect([...getIncomingEdges(unknown)]).toEqual([]);
    expect([...getConnectedEdges(unknown)]).toEqual([]);

    registerOutgoing(edge, a);
    registerIncoming(edge, unknown);

    const firstSnapshot = getConnectedEdges(a);
    const secondSnapshot = getConnectedEdges(a);
    expect([...firstSnapshot]).toEqual([...secondSnapshot]);

    const later = { from: a, to: a };
    registerOutgoing(later, a);
    expect([...firstSnapshot]).toEqual([edge]);
    expect([...getConnectedEdges(a)]).toEqual([edge, later]);
  });
});
