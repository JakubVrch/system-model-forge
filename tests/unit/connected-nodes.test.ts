import { describe, expect, it } from 'vitest';

import { Node, Edge, connectedNodes } from '@core';

class EventEdge extends Edge {}

describe('connectedNodes', () => {
  it('follows outgoing edges to their targets', () => {
    const orders = new Node();
    const payments = new Node();
    const customer = new Node();
    new Edge(orders, payments);
    new Edge(customer, orders);

    const result = connectedNodes(new Set([orders]), () => true, 'outgoing');

    expect(result.size).toBe(1);
    expect([...result][0]).toBe(payments);
  });

  it('follows incoming edges to their sources', () => {
    const orders = new Node();
    const payments = new Node();
    const customer = new Node();
    new Edge(orders, payments);
    new Edge(customer, orders);

    const result = connectedNodes(new Set([orders]), () => true, 'incoming');

    expect(result.size).toBe(1);
    expect([...result][0]).toBe(customer);
  });

  it('follows both directions in edge creation order and visits a self-loop once', () => {
    const orders = new Node();
    const customer = new Node();
    const payments = new Node();
    new Edge(customer, orders);
    new Edge(orders, payments);
    new Edge(orders, orders);

    const result = [...connectedNodes(new Set([orders]), () => true, 'both')];

    expect(result).toHaveLength(3);
    expect(result[0]).toBe(customer);
    expect(result[1]).toBe(payments);
    expect(result[2]).toBe(orders);
  });

  it('follows only edges accepted by the filter', () => {
    const orders = new Node();
    const events = new Node();
    const database = new Node();
    new EventEdge(orders, events);
    new Edge(orders, database);

    const result = connectedNodes(
      new Set([orders]),
      edge => edge instanceof EventEdge,
      'outgoing',
    );

    expect(result.size).toBe(1);
    expect([...result][0]).toBe(events);
  });

  it('stops after one hop, even when the graph contains a cycle', () => {
    const orders = new Node();
    const payments = new Node();
    const bank = new Node();
    new Edge(orders, payments);
    new Edge(payments, bank);
    new Edge(bank, orders);

    const result = connectedNodes(new Set([orders]), () => true, 'outgoing');

    expect(result.size).toBe(1);
    expect([...result][0]).toBe(payments);
  });

  it('returns each target once but keeps different nodes with the same notation', () => {
    const orders = new Node();
    const firstTarget = new Node();
    const secondTarget = new Node();
    new Edge(orders, firstTarget);
    new Edge(orders, firstTarget);
    new Edge(orders, secondTarget);

    const result = [...connectedNodes(new Set([orders]), () => true, 'outgoing')];

    // Both targets print as "Node", so compare the actual objects.
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(firstTarget);
    expect(result[1]).toBe(secondTarget);
  });

  it('skips missing endpoints', () => {
    const orders = new Node();
    new Edge(orders, undefined);
    new Edge(undefined, orders);

    const result = connectedNodes(new Set([orders]), () => true, 'both');

    expect(result.size).toBe(0);
  });

  it('returns no nodes for empty input', () => {
    const result = connectedNodes(new Set(), () => true, 'outgoing');

    expect(result.size).toBe(0);
  });
});
