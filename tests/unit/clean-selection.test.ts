import { describe, expect, it } from 'vitest';

import { Node, Edge, cleanSelection, type GraphElement } from '@core';

describe('cleanSelection', () => {
  it('keeps edges when both endpoints are selected, even if the edge comes first', () => {
    const orders = new Node();
    const payments = new Node();
    const first = new Edge(orders, payments);
    const parallel = new Edge(orders, payments);
    const loop = new Edge(orders, orders);
    const selection = new Set<GraphElement>([first, orders, parallel, loop, payments]);

    const result = [...cleanSelection(selection)];

    // Check identity because distinct nodes and edges can have identical properties.
    expect(result).toHaveLength(5);
    expect(result[0]).toBe(first);
    expect(result[1]).toBe(orders);
    expect(result[2]).toBe(parallel);
    expect(result[3]).toBe(loop);
    expect(result[4]).toBe(payments);
  });

  it('removes edges to nodes outside the selection', () => {
    const orders = new Node();
    const payments = new Node();
    const missingTarget = new Edge(orders, payments);
    const missingSource = new Edge(payments, orders);

    const result = cleanSelection(new Set<GraphElement>([orders, missingTarget, missingSource]));

    expect(result.size).toBe(1);
    expect([...result][0]).toBe(orders);
  });

  it('removes edges with undefined endpoints', () => {
    const orders = new Node();
    const missingTarget = new Edge(orders, undefined);
    const missingSource = new Edge(undefined, orders);

    const result = cleanSelection(new Set<GraphElement>([orders, missingTarget, missingSource]));

    expect(result.size).toBe(1);
    expect([...result][0]).toBe(orders);
  });

  it('keeps isolated nodes without adding unselected edges or endpoints', () => {
    const orders = new Node();
    const payments = new Node();
    const isolated = new Node();
    const edge = new Edge(orders, payments);

    expect([...cleanSelection(new Set<GraphElement>([edge]))]).toEqual([]);
    const nodes = cleanSelection(new Set([orders, payments, isolated]));
    expect(nodes.size).toBe(3);
    expect(nodes.has(orders)).toBe(true);
    expect(nodes.has(payments)).toBe(true);
    expect(nodes.has(isolated)).toBe(true);
  });

  it('returns a protected result without changing the selection or model', () => {
    const orders = new Node();
    const payments = new Node();
    const edge = new Edge(orders, payments);
    const selection = new Set<GraphElement>([orders, edge]);

    const result = cleanSelection(selection);

    expect(() => (result as Set<GraphElement>).clear()).toThrow();
    expect(cleanSelection(selection)).not.toBe(result);
    expect([...selection]).toEqual([orders, edge]);
    expect([...orders.outgoing]).toEqual([edge]);
    expect([...payments.incoming]).toEqual([edge]);
    expect(Object.isFrozen(orders)).toBe(false);
    expect(Object.isFrozen(edge)).toBe(false);
  });

  it('returns a fresh protected empty set for an empty selection', () => {
    const empty = cleanSelection(new Set());

    expect(empty.size).toBe(0);
    expect(Object.isFrozen(empty)).toBe(true);
    expect(empty).not.toBe(cleanSelection(new Set()));
  });
});
