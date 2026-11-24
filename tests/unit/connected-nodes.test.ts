import { describe, expect, it } from 'vitest';

import { Node, Edge, connectedNodes } from '@core';

class EventEdge extends Edge {}

describe('connectedNodes', () => {
  it('follows outgoing edges to their targets', () => {
    const orders = new Node('node');
    const payments = new Node('node');
    const customer = new Node('node');
    new Edge(orders, payments, 'relationship');
    new Edge(customer, orders, 'relationship');

    const result = connectedNodes(new Set([orders]), () => true, 'outgoing');

    expect(result.size).toBe(1);
    expect([...result][0]).toBe(payments);
  });

  it('follows incoming edges to their sources', () => {
    const orders = new Node('node');
    const payments = new Node('node');
    const customer = new Node('node');
    new Edge(orders, payments, 'relationship');
    new Edge(customer, orders, 'relationship');

    const result = connectedNodes(new Set([orders]), () => true, 'incoming');

    expect(result.size).toBe(1);
    expect([...result][0]).toBe(customer);
  });

  it('follows both directions in edge creation order and visits a self-loop once', () => {
    const orders = new Node('node');
    const customer = new Node('node');
    const payments = new Node('node');
    new Edge(customer, orders, 'relationship');
    new Edge(orders, payments, 'relationship');
    new Edge(orders, orders, 'relationship');

    const result = [...connectedNodes(new Set([orders]), () => true, 'both')];

    expect(result).toHaveLength(3);
    expect(result[0]).toBe(customer);
    expect(result[1]).toBe(payments);
    expect(result[2]).toBe(orders);
  });

  it('follows only edges accepted by the filter', () => {
    const orders = new Node('node');
    const events = new Node('node');
    const database = new Node('node');
    new EventEdge(orders, events, 'event');
    new Edge(orders, database, 'relationship');

    const result = connectedNodes(
      new Set([orders]),
      edge => edge instanceof EventEdge,
      'outgoing',
    );

    expect(result.size).toBe(1);
    expect([...result][0]).toBe(events);
  });

  it('stops after one hop, even when the graph contains a cycle', () => {
    const orders = new Node('node');
    const payments = new Node('node');
    const bank = new Node('node');
    new Edge(orders, payments, 'relationship');
    new Edge(payments, bank, 'relationship');
    new Edge(bank, orders, 'relationship');

    const result = connectedNodes(new Set([orders]), () => true, 'outgoing');

    expect(result.size).toBe(1);
    expect([...result][0]).toBe(payments);
  });

  it('returns each target once but keeps different nodes with the same notation', () => {
    const orders = new Node('node');
    const firstTarget = new Node('node');
    const secondTarget = new Node('node');
    new Edge(orders, firstTarget, 'relationship');
    new Edge(orders, firstTarget, 'relationship');
    new Edge(orders, secondTarget, 'relationship');

    const result = [...connectedNodes(new Set([orders]), () => true, 'outgoing')];

    // Both targets print as "Node", so compare the actual objects.
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(firstTarget);
    expect(result[1]).toBe(secondTarget);
  });

  it('skips missing endpoints', () => {
    const orders = new Node('node');
    new Edge(orders, undefined, 'relationship');
    new Edge(undefined, orders, 'relationship');

    const result = connectedNodes(new Set([orders]), () => true, 'both');

    expect(result.size).toBe(0);
  });

  it('returns no nodes for empty input', () => {
    const result = connectedNodes(new Set(), () => true, 'outgoing');

    expect(result.size).toBe(0);
  });
});
