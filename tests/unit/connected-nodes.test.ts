import { describe, expect, it, vi } from 'vitest';
import { Node, Edge, connectedNodes } from '@core';

function identical(actual: Iterable<Node>, expected: Iterable<Node>): void {
  const values = [...actual], expectedValues = [...expected];
  expect(values).toHaveLength(expectedValues.length);
  expectedValues.forEach((node, i) => expect(values[i]).toBe(node));
}

class EventEdge extends Edge {
  public readonly enabled = true;
}

describe('connectedNodes', () => {
  it('filters edges before hopping, using kinds, properties, and endpoints', () => {
    const start = new Node(), accepted = new Node(), rejected = new Node(), distant = new Node();
    const eventFlow = new EventEdge(start, accepted);
    new Edge(start, rejected);
    new Edge(accepted, distant);
    identical(connectedNodes(new Set([start]), e => e instanceof EventEdge && e.enabled && e.from === start, 'outgoing'), [accepted]);
    const predicate = vi.fn((_edge: Edge) => true);
    const missing = new Edge(start, undefined);
    identical(connectedNodes(new Set([start]), predicate, 'outgoing'), [accepted, rejected]);
    expect(predicate.mock.calls.map(call => call[0])).toEqual([eventFlow, ...[...start.outgoing].slice(1)]);
    expect(predicate).toHaveBeenCalledWith(missing);
  });

  it('preserves incident order for both, and selects the opposite endpoint', () => {
    const a = new Node(), b = new Node(), c = new Node();
    new Edge(b, a);
    new Edge(a, c);
    new Edge(a, a);
    new Edge(a, b);
    new Edge(undefined, a);
    identical(connectedNodes(new Set([a]), () => true, 'outgoing'), [c, a, b]);
    identical(connectedNodes(new Set([a]), () => true, 'incoming'), [b, a]);
    const predicate = vi.fn(() => true);
    identical(connectedNodes(new Set([a]), predicate, 'both'), [b, c, a]);
    expect(predicate).toHaveBeenCalledTimes(5);
    identical(connectedNodes(new Set([a]), () => false, 'both'), []);
  });

  it.each(['outgoing', 'incoming', 'both'] as const)('reads unique starts once in %s mode and ignores disconnected growth', direction => {
    const a = new Node(), b = new Node(), c = new Node();
    new Edge(a, b); new Edge(b, c); new Edge(c, a); new Edge(a, a);
    new Edge(a, undefined); new Edge(undefined, a);
    const key = direction === 'both' ? 'edges' : direction;
    const before = [a, b, c].map(n => [[...n.outgoing], [...n.incoming], [...n.edges]]);
    const inputs: ReadonlySet<Node> = new Set([a, a, b]);
    const expectedCalls = a[key].size + b[key].size;
    const getter = vi.spyOn(a, key, 'get');
    const predicate = vi.fn(() => true);
    const first = connectedNodes(inputs, predicate, direction);
    expect(getter).toHaveBeenCalledTimes(1);
    expect(predicate).toHaveBeenCalledTimes(expectedCalls);
    new Edge(new Node(), new Node());
    predicate.mockClear();
    identical(connectedNodes(inputs, predicate, direction), first);
    expect(predicate).toHaveBeenCalledTimes(expectedCalls);
    expect(Object.isFrozen(first)).toBe(true);
    expect(() => (first as Set<Node>).add(a)).toThrow();
    expect(Object.isFrozen(a)).toBe(false);
    expect([...inputs]).toEqual([a, b]);
    expect([a, b, c].map(n => [[...n.outgoing], [...n.incoming], [...n.edges]])).toEqual(before);
    getter.mockRestore();
  });

  it('deduplicates references, preserves equal-notation identities and treats shared edges per start', () => {
    const a = new Node(), b = new Node(), c = new Node();
    new Edge(a, b); new Edge(a, b); new Edge(a, c);
    identical(connectedNodes(new Set([a]), () => true, 'outgoing'), [b, c]);
    const predicate = vi.fn(() => true);
    identical(connectedNodes(new Set([a, b, a]), predicate, 'both'), [b, c, a]);
    expect(predicate).toHaveBeenCalledTimes(5);
  });

  it.each(['outgoing', 'incoming', 'both'] as const)('does not inspect endpoints of rejected edges in %s mode', direction => {
    const start = new Node();
    const edge = new Edge(start, start);
    Object.defineProperty(edge, 'from', { get: () => { throw new Error('unexpected endpoint read'); } });
    Object.defineProperty(edge, 'to', { get: () => { throw new Error('unexpected endpoint read'); } });
    identical(connectedNodes(new Set([start]), candidate => {
      expect(candidate).toBe(edge);
      return false;
    }, direction), []);
  });

  it('returns fresh protected empty results and propagates predicate errors', () => {
    const a = new Node();
    const first = connectedNodes(new Set([]), () => true, 'both');
    expect(first).not.toBe(connectedNodes(new Set([]), () => true, 'both'));
    expect(Object.isFrozen(first)).toBe(true);
    identical(connectedNodes(new Set([a]), () => true, 'incoming'), []);
    new Edge(a, a);
    const error = new Error('predicate');
    expect(() => connectedNodes(new Set([a]), () => { throw error; }, 'both')).toThrow(error);
  });
});
