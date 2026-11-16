import { describe, expect, it } from 'vitest';
import { defineElement, Node, Edge } from '@core';

class ServiceNode extends Node {
  public constructor(public id: string, public name = id, public readonly options = { enabled: true }) {
    super();
  }
}

class EventEdge extends Edge {
  public constructor(from: Node, to: Node, public readonly kind: 'read' | 'write', ...labels: string[]) {
    super(from, to);
    this.labels = labels;
  }
  public readonly labels: string[];
}

describe('defineElement', () => {
  it('forwards constructor arguments and defaults, creating distinct shallow-frozen instances', () => {
    const service = defineElement(ServiceNode);
    const options = { enabled: true };
    const first = service('orders', 'Orders', options);
    const second = service('orders');
    expect(first).toBeInstanceOf(ServiceNode);
    expect(first).not.toBe(second);
    expect(first.id).toBe('orders');
    expect(first.name).toBe('Orders');
    expect(second.name).toBe('orders');
    expect(first.options).toBe(options);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Reflect.set(first, 'id', 'changed')).toBe(false);
    expect(Object.isFrozen(options)).toBe(false);
    options.enabled = false;
    expect(first.options.enabled).toBe(false);
  });

  it('freezes after the complete subclass constructor and preserves rest arguments and adjacency', () => {
    const eventFlow = defineElement(EventEdge);
    const from = new Node(), to = new Node();
    const edge = eventFlow(from, to, 'write', 'audit', 'async');
    expect(edge.kind).toBe('write');
    expect(edge.labels).toEqual(['audit', 'async']);
    expect(Object.isFrozen(edge)).toBe(true);
    expect(edge.from).toBe(from);
    expect(edge.to).toBe(to);
    expect([...from.outgoing][0]).toBe(edge);
    expect([...to.incoming][0]).toBe(edge);
    expect(Object.isFrozen(from)).toBe(false);
    expect(Object.isFrozen(to)).toBe(false);
  });

  it('recognizes subclasses and existing instances without creating or freezing them', () => {
    let constructed = 0;
    class Child extends ServiceNode { public constructor() { super('child'); constructed++; } }
    const service = defineElement(ServiceNode);
    const raw = new ServiceNode('raw');
    const child = new Child();
    expect(service.is(raw)).toBe(true);
    expect(service.is(child)).toBe(true);
    for (const value of [new Node(), new Edge(undefined, undefined), {}, null, undefined, 42, 'service', service]) {
      expect(service.is(value)).toBe(false);
    }
    expect(constructed).toBe(1);
    expect(Object.isFrozen(raw)).toBe(false);
    expect(Object.isFrozen(child)).toBe(false);
  });

  it('freezes the callable definition and its guard property', () => {
    const service = defineElement(ServiceNode);
    expect(Object.isFrozen(service)).toBe(true);
    expect(Reflect.set(service, 'is', () => false)).toBe(false);
    expect(() => Object.defineProperty(service, 'is', { value: () => false })).toThrow();
    expect(service.is(service('orders'))).toBe(true);
  });

  it('propagates the original constructor error', () => {
    const error = new Error('invalid model');
    class Invalid extends Node { public constructor() { super(); throw error; } }
    const invalid = defineElement(Invalid);
    expect(() => invalid()).toThrow(error);
    try { invalid(); } catch (caught) { expect(caught).toBe(error); }
  });
});
