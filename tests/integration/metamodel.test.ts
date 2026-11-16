import { describe, expect, it } from 'vitest';
import * as metamodel from '@metamodel';
import { exportDiagram } from '@core';

describe('example metamodel', () => {
  it('publishes only callable definitions and preserves domain-specific relationship arguments', () => {
    expect(Object.keys(metamodel).sort()).toEqual([
      'service', 'module', 'topic', 'database', 'moduleComposition', 'eventFlow', 'databaseUsage',
    ].sort());
    for (const definition of Object.values(metamodel)) expect(Object.isFrozen(definition)).toBe(true);
    const { service: createService, topic, database, eventFlow: createEvent, databaseUsage } = metamodel;
    const source = createService('test', 'Test');
    const target = topic('test-topic', 'Test topic');
    const store = database('test-db', 'Test database');
    const published = createEvent(source, target, 'publish');
    const subscribed = createEvent(source, target, 'subscribe');
    const uses = databaseUsage(source, store);
    const writes = databaseUsage(source, store, 'write');
    expect(published.kind).toBe('publish');
    expect(subscribed.kind).toBe('subscribe');
    expect(uses.label).toBe('uses');
    expect(writes.label).toBe('write');
    expect([...source.outgoing]).toEqual([published, subscribed, uses, writes]);
    expect([...source.outgoing][0]).toBe(published);
    expect(metamodel.service.is(source)).toBe(true);
    expect(metamodel.service.is(target)).toBe(false);
    expect(metamodel.eventFlow.is(published)).toBe(true);
    expect(metamodel.eventFlow.is(writes)).toBe(false);
    expect(Object.isFrozen(writes)).toBe(true);
  });

  it('exports C4 containers, components, queues, databases, and directed relationships', () => {
    const service = metamodel.service('api', 'API');
    const module = metamodel.module('handler', 'Handler');
    const topic = metamodel.topic('events', 'Events');
    const database = metamodel.database('store', 'Store');
    const composition = metamodel.moduleComposition(service, module);
    const flow = metamodel.eventFlow(service, topic, 'publish');
    const usage = metamodel.databaseUsage(service, database, 'write');
    expect(exportDiagram([service, module, topic, database, composition, flow, usage], 'C4Component', '')).toBe(
      'C4Component\n' +
      'Container(api, "API")\n' +
      'Component(handler, "Handler")\n' +
      'SystemQueue(events, "Events")\n' +
      'SystemDb(store, "Store")\n' +
      'Rel(api, handler, "contains")\n' +
      'Rel(api, events, "publish")\n' +
      'Rel(api, store, "write")\n',
    );
  });
});
