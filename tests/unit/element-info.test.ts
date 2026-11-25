import { expect, it } from 'vitest';
import { Node, Edge, defineElement } from '@core';

it('returns fresh frozen own-data snapshots without evaluating getters or navigation', () => {
  let calls = 0;
  class Parent extends Node { inherited = 'base'; }
  class Item extends Parent {
    #secret = 'hidden';
    count = 0; nil = null; absent = undefined;
    bool = true; nested = {}; bad = Infinity; fn = () => 1;
    get computed() { calls++; throw Error(this.#secret); }
  }
  const item = new Item('id', 'Name');
  Object.defineProperty(item, 'accessor', { enumerable: true, get() { calls++; return 'no'; } });
  Object.defineProperty(item, 'hidden', { value: 'no' });
  Object.defineProperty(item, Symbol('private'), { value: 'no', enumerable: true });
  const info = item.getElementInfo();
  expect(info).toEqual({ inherited: 'base', count: 0, nil: null, absent: undefined });
  expect(calls).toBe(0);
  expect(Object.isFrozen(info)).toBe(true);
  expect(item.getElementInfo()).not.toBe(info);
  item.count = 1; expect(info.count).toBe(0);
  expect(item.name).toBe('Name');
});

it('keeps author identity, endpoints, business kind, overrides and factory behavior separate', () => {
  class Flow extends Edge { kind = 'publish'; }
  const node = defineElement(Node), flow = defineElement(Flow);
  const a = node('same', 'Same'), b = node('same', 'Same'), edge = flow(a, b, 'flow', 'Flow');
  expect(a).not.toBe(b); expect(node.is(a)).toBe(true); expect(Object.isFrozen(edge)).toBe(true);
  expect(edge.id).toBe('flow'); expect(edge.getElementInfo()).toEqual({ kind: 'publish' });
  class Custom extends Node { override getElementInfo() { return { renamed: 'value' }; } }
  expect(new Custom('custom', 'Node').getElementInfo()).toEqual({ renamed: 'value' });
});

it('retains business endpoints on nodes and excludes graph endpoints on edges', () => {
  class Route extends Node { from = 'Prague'; to = 'Brno'; }
  expect(new Route('route', 'Node').getElementInfo()).toEqual({ from: 'Prague', to: 'Brno' });
  expect(new Edge(undefined, undefined, 'edge', 'Relationship').getElementInfo()).toEqual({});
});
