import { describe, expect, it } from 'vitest';

import {
  getConnectedEdges,
  getIncomingEdges,
  getOutgoingEdges,
  registerIncoming,
  registerOutgoing,
} from '../../src/element/adjacency.js';

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

    expect(getOutgoingEdges(a)).toEqual([first, self]);
    expect(getIncomingEdges(a)).toEqual([second, self]);
    expect(getConnectedEdges(a)).toEqual([first, self, second]);
    expect(getConnectedEdges(a)).toEqual([...getOutgoingEdges(a), ...getIncomingEdges(a).filter((edge) => edge !== self)]);
    expect(getConnectedEdges(a)).toHaveLength(3);
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
      (outgoing as unknown as unknown[]).push({});
    }).toThrow();

    expect(() => {
      (incoming as unknown as unknown[]).push({});
    }).toThrow();

    expect(() => {
      (connected as unknown as unknown[]).push({});
    }).toThrow();
  });

  it('returns empty arrays for unknown nodes and preserves snapshot stability', () => {
    const unknown = {} as object;
    const a = {} as object;
    const edge = { from: a, to: unknown };

    expect(getOutgoingEdges(unknown)).toEqual([]);
    expect(getIncomingEdges(unknown)).toEqual([]);
    expect(getConnectedEdges(unknown)).toEqual([]);

    registerOutgoing(edge, a);
    registerIncoming(edge, unknown);

    const firstSnapshot = getConnectedEdges(a);
    const secondSnapshot = getConnectedEdges(a);
    expect(firstSnapshot).toEqual(secondSnapshot);

    const later = { from: a, to: a };
    registerOutgoing(later, a);
    expect(firstSnapshot).toEqual([edge]);
    expect(getConnectedEdges(a)).toEqual([edge, later]);
  });
});
