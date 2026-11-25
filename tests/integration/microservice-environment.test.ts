import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { findById, cleanSelection, readonlySet, exportDiagram, saveDiagram } from 'governed-model-core';
import { partition as root } from './fixtures/microservice-environment/microservice-environment.partition.ts';
import { partition as databases } from './fixtures/microservice-environment/databases/databases.partition.ts';
import { partition as topics } from './fixtures/microservice-environment/topics/topics.partition.ts';
import { partition as services } from './fixtures/microservice-environment/services/services.partition.ts';
import { partition as serviceA } from './fixtures/microservice-environment/services/service-a/service-a.partition.ts';
import { partition as serviceB } from './fixtures/microservice-environment/services/service-b/service-b.partition.ts';

const expectedA = `C4Component
title Service A events
Container(serviceA, "Service A")
Component(moduleA1, "Module A1")
Component(moduleA2, "Module A2")
SystemQueue(shared, "Shared topic")
SystemQueue(topicA, "Topic A")
Rel(serviceA, moduleA1, "contains")
Rel(serviceA, moduleA2, "contains")
Rel(serviceA, shared, "publish")
Rel(serviceA, shared, "subscribe")
Rel(serviceA, topicA, "publish")
`;
const expectedB = `C4Component
title Service B events
Container(serviceB, "Service B")
Component(moduleB1, "Module B1")
Component(moduleB2, "Module B2")
SystemQueue(shared, "Shared topic")
SystemQueue(topicB, "Topic B")
Rel(serviceB, moduleB1, "contains")
Rel(serviceB, moduleB2, "contains")
Rel(serviceB, shared, "subscribe")
Rel(serviceB, topicB, "publish")
`;

describe('microservice environment', () => {
  it.each([
    ['Service A events', serviceA.diagrams.eventOverview, expectedA],
    ['Service B events', serviceB.diagrams.eventOverview, expectedB],
  ] as const)('saves the expected diagram for %s', async (title, overview, expected) => {
    const directory = await mkdtemp(path.join(tmpdir(), 'service-overviews-'));

    try {
      const diagram = exportDiagram(overview.data, `C4Component\ntitle ${title}`, '');
      const destination = path.join(directory, 'events.mmd');

      expect(diagram).toBe(overview.inNotation);
      await saveDiagram(overview.inNotation, destination);

      expect(await readFile(destination, 'utf8')).toBe(expected);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });


  it('publishes local contributions without forwarding descendants or inherited vocabulary', () => {
    expect(root.elements).toEqual({});
    expect(root.diagrams).toEqual({});
    expect(root.metamodel).toEqual({});
    expect(services.elements).toEqual({});
    expect(services.diagrams).toEqual({});
    expect(services.metamodel.service).toBeTypeOf('function');
    expect(serviceA.metamodel).toEqual({});
    expect(serviceB.metamodel).toEqual({});
  });

  it.each([
    ['Service A', serviceA, 'databaseA'],
    ['Service B', serviceB, 'databaseB'],
  ] as const)('%s uses shared vocabulary and published infrastructure instances', (_, child, databaseId) => {
    const sharedTopic = findById(topics.elements.topics, 'shared');
    const database = findById(databases.elements.databases, databaseId);
    const service = [...child.elements.localModel].find(services.metamodel.service.is);
    const relationships = [...child.elements.localModel];

    expect(services.metamodel.service.is(service)).toBe(true);
    expect(sharedTopic).toBeDefined();
    expect(database).toBeDefined();
    expect(relationships.some(edge =>
      services.metamodel.eventFlow.is(edge) && edge.from === service && edge.to === sharedTopic,
    )).toBe(true);
    expect(relationships.some(edge =>
      services.metamodel.databaseUsage.is(edge) && edge.from === service && edge.to === database,
    )).toBe(true);
    expect(child.diagrams.eventOverview.data.has(sharedTopic!)).toBe(true);
  });

  it('allows missing infrastructure references and omits dangling edges from a clean view', () => {
    const service = services.metamodel.service('isolated', 'Isolated service');
    const missingTopic = findById(topics.elements.topics, 'missing');
    const missingDatabase = findById(databases.elements.databases, 'missing');
    const flow = services.metamodel.eventFlow(service, missingTopic, 'event-flow', 'publish', 'publish');
    const usage = services.metamodel.databaseUsage(service, missingDatabase, 'databaseUsage', 'uses');

    expect(flow.to).toBeUndefined();
    expect(usage.to).toBeUndefined();
    expect([...cleanSelection(readonlySet([service, flow, usage]))]).toEqual([service]);
  });

});
