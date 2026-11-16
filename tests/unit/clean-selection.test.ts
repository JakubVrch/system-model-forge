import { describe, expect, it } from 'vitest';
import { Node, Edge, cleanSelection, exportDiagram, type GraphElement } from '@core';

function identical(actual: Iterable<GraphElement>, expected: Iterable<GraphElement>): void {
  const values = [...actual], expectedValues = [...expected];
  expect(values).toHaveLength(expectedValues.length);
  expectedValues.forEach((element, i) => expect(values[i]).toBe(element));
}

describe('cleanSelection', () => {
  it('keeps exact entries in input order using identity and both defined endpoints', () => {
    const a = new Node(), b = new Node(), absent = new Node(), isolated = new Node();
    const edge = new Edge(a, b), parallel = new Edge(a, b), loop = new Edge(a, a);
    const omittedTarget = new Edge(a, absent), omittedSource = new Edge(absent, b);
    const missingTarget = new Edge(a, undefined), missingSource = new Edge(undefined, b);
    const input: ReadonlySet<GraphElement> = new Set([edge, omittedTarget, missingTarget, a, parallel, omittedSource, missingSource, loop, b, isolated, edge, a]);
    const before = [a, b, absent, isolated].map(n => [[...n.outgoing], [...n.incoming], [...n.edges]]);
    const result = cleanSelection(input);
    identical(result, [edge, a, parallel, loop, b, isolated]);
    expect(Object.isFrozen(result)).toBe(true);
    expect(() => (result as Set<GraphElement>).clear()).toThrow();
    expect(Object.isFrozen(a)).toBe(false);
    expect(Object.isFrozen(edge)).toBe(false);
    expect(cleanSelection(input)).not.toBe(result);
    expect([a, b, absent, isolated].map(n => [[...n.outgoing], [...n.incoming], [...n.edges]])).toEqual(before);
    identical([...input], [edge, omittedTarget, missingTarget, a, parallel, omittedSource, missingSource, loop, b, isolated]);
  });

  it('returns fresh protected empty sets and never adds unselected elements', () => {
    const a = new Node(), b = new Node();
    const edge = new Edge(a, b);
    const empty = cleanSelection(new Set<GraphElement>([]));
    expect(empty.size).toBe(0);
    expect(Object.isFrozen(empty)).toBe(true);
    expect(empty).not.toBe(cleanSelection(new Set<GraphElement>([])));
    identical(cleanSelection(new Set<GraphElement>([edge])), []);
    identical(cleanSelection(new Set<GraphElement>([a, b])), [a, b]);
  });

  it('supports stable native merging and 100 deterministic explicit cleanup exports', () => {
    const a = new Node(), b = new Node(), omitted = new Node();
    const kept = new Edge(a, b), dropped = new Edge(a, omitted);
    const local = Object.freeze([a, kept, dropped]);
    const reached = Object.freeze([b, a, b]);
    const before = [[...a.edges], [...b.edges], [...omitted.edges]];
    for (let i = 0; i < 100; i++) {
      const merged = new Set<GraphElement>([...local, ...reached]);
      identical([...merged], [a, kept, dropped, b]);
      const result = cleanSelection(merged);
      identical(result, [a, kept, b]);
      expect(exportDiagram(result)).toBe('diagram\nNode\nNode\nEdge\nend\n');
    }
    identical(local, [a, kept, dropped]);
    identical(reached, [b, a, b]);
    expect([[...a.edges], [...b.edges], [...omitted.edges]]).toEqual(before);
    expect(exportDiagram(local)).toBe('diagram\nNode\nEdge\nEdge\nend\n');
  });
});
