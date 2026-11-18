import { expect, it } from 'vitest';
import { Node, Edge, defineElement, graphKind } from '@core';

it('returns fresh frozen own-data snapshots without evaluating getters or navigation', () => {
  let calls = 0;
  class Parent extends Node { inherited = 'base'; }
  class Item extends Parent {
    #secret = 'hidden';
    name = 'Name'; count = 0; nil = null; absent = undefined;
    bool = true; nested = {}; bad = Infinity; fn = () => 1;
    get computed() { calls++; throw Error(this.#secret); }
  }
  const item = new Item('id');
  Object.defineProperty(item, 'accessor', { enumerable: true, get() { calls++; return 'no'; } });
  Object.defineProperty(item, 'hidden', { value: 'no' });
  Object.defineProperty(item, Symbol('private'), { value: 'no', enumerable: true });
  const info = item.getElementInfo();
  expect(info).toEqual({ inherited: 'base', name: 'Name', count: 0, nil: null, absent: undefined });
  expect(calls).toBe(0);
  expect(Object.isFrozen(info)).toBe(true);
  expect(item.getElementInfo()).not.toBe(info);
  item.name = 'Later'; expect(info.name).toBe('Name');
});

it('keeps author identity, endpoints, business kind, overrides and factory behavior separate', () => {
  class Flow extends Edge { kind = 'publish'; }
  const node = defineElement(Node), flow = defineElement(Flow);
  const a = node('same'), b = node('same'), edge = flow(a, b, 'flow');
  expect(a).not.toBe(b); expect(node.is(a)).toBe(true); expect(Object.isFrozen(edge)).toBe(true);
  expect(edge.id).toBe('flow'); expect(edge.getElementInfo()).toEqual({ kind: 'publish' });
  class Custom extends Node { override getElementInfo() { return { renamed: 'value' }; } }
  expect(new Custom('custom').getElementInfo()).toEqual({ renamed: 'value' });
});

it('publishes an immutable non-enumerable versioned graph protocol', () => {
  expect(graphKind).toBe(Symbol.for('governed-model-core.graphKind.v1'));
  for (const [prototype, kind] of [[Node.prototype, 'node'], [Edge.prototype, 'edge']] as const) {
    const descriptor = Object.getOwnPropertyDescriptor(prototype, graphKind)!;
    expect(descriptor).toMatchObject({ enumerable: false, writable: false, configurable: false, value: { version: 1, kind } });
    expect(Object.isFrozen(descriptor.value)).toBe(true);
  }
});
