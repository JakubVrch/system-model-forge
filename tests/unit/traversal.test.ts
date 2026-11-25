import { describe, expect, it } from 'vitest';

import { Edge, Node } from '@core';

describe('node edges', () => {
  it('returns no edges for an isolated node', () => {
    const orders = new Node('node', 'Node');

    expect([...orders.outgoing]).toEqual([]);
    expect([...orders.incoming]).toEqual([]);
    expect([...orders.edges]).toEqual([]);
  });

  it('separates incoming and outgoing edges and keeps creation order', () => {
    const orders = new Node('node', 'Node');
    const payments = new Node('node', 'Node');
    const incoming = new Edge(payments, orders, 'relationship', 'Relationship');
    const outgoing = new Edge(orders, payments, 'relationship', 'Relationship');

    expect([...orders.incoming]).toEqual([incoming]);
    expect([...orders.outgoing]).toEqual([outgoing]);
    expect([...orders.edges]).toEqual([incoming, outgoing]);
  });

  it('lists a self-loop once among all edges', () => {
    const orders = new Node('node', 'Node');
    const loop = new Edge(orders, orders, 'relationship', 'Relationship');

    expect([...orders.outgoing]).toEqual([loop]);
    expect([...orders.incoming]).toEqual([loop]);
    expect([...orders.edges]).toEqual([loop]);
  });

  it('keeps edges whose other endpoint is missing', () => {
    const orders = new Node('node', 'Node');
    const missingTarget = new Edge(orders, undefined, 'relationship', 'Relationship');
    const missingSource = new Edge(undefined, orders, 'relationship', 'Relationship');

    expect([...orders.outgoing]).toEqual([missingTarget]);
    expect([...orders.incoming]).toEqual([missingSource]);
    expect([...orders.edges]).toEqual([missingTarget, missingSource]);
  });

  it('leaves earlier snapshots unchanged when new edges are added', () => {
    const orders = new Node('node', 'Node');
    const payments = new Node('node', 'Node');
    const first = new Edge(orders, payments, 'relationship', 'Relationship');
    const outgoingBefore = orders.outgoing;
    const incomingBefore = orders.incoming;
    const edgesBefore = orders.edges;

    const later = new Edge(payments, orders, 'relationship', 'Relationship');
    const laterOutgoing = new Edge(orders, payments, 'relationship', 'Relationship');

    expect([...outgoingBefore]).toEqual([first]);
    expect([...incomingBefore]).toEqual([]);
    expect([...edgesBefore]).toEqual([first]);
    expect([...orders.incoming]).toEqual([later]);
    expect([...orders.outgoing]).toEqual([first, laterOutgoing]);
    expect([...orders.edges]).toEqual([first, later, laterOutgoing]);
  });

  it('prevents changes to all three edge collections', () => {
    const orders = new Node('node', 'Node');
    new Edge(orders, orders, 'relationship', 'Relationship');

    // These casts deliberately try operations forbidden by ReadonlySet.
    expect(() => (orders.outgoing as Set<Edge>).clear()).toThrow();
    expect(() => (orders.incoming as Set<Edge>).clear()).toThrow();
    expect(() => (orders.edges as Set<Edge>).clear()).toThrow();
  });
});
