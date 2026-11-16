import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { connectedNodes, cleanSelection, filterSet, unionSet, Node, exportDiagram, saveDiagram, type GraphElement } from '@core';
import { service, eventFlow } from '@metamodel';
import { serviceA, serviceB, topics, sharedTopic, topicA, topicB, unrelatedTopic, databases, databaseA, databaseB } from '@fixtures/microservice-environment';

function exportContext(title: string, elements: Iterable<GraphElement>): string {
  return exportDiagram(elements, `C4Component\ntitle ${title}`, '');
}

function assertReferences(actual: Iterable<GraphElement>, expected: Iterable<GraphElement>): void {
  const values = [...actual], expectedValues = [...expected];
  expect(values).toHaveLength(expectedValues.length);
  expectedValues.forEach((element, i) => expect(values[i]).toBe(element));
}

function derive(local: ReadonlySet<GraphElement>): ReadonlySet<GraphElement> {
  const starts = filterSet(local, service.is);
  const reached = connectedNodes(starts, eventFlow.is, 'outgoing');
  return cleanSelection(unionSet(local, reached));
}

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
  it('exports independent source fragments and exact derived selections', () => {
    assertReferences(topics, [sharedTopic, topicA, topicB, unrelatedTopic]);
    assertReferences(databases, [databaseA, databaseB]);
    for (const [model, exclusive, database, other, expected] of [
      [serviceA, topicA, databaseA, serviceB, expectedA],
      [serviceB, topicB, databaseB, serviceA, expectedB],
    ] as const) {
      expect(model.modules.size).toBe(2);
      assertReferences(model.localModel, [model.service, ...model.modules, ...model.relationships]);
      const eventCount = model === serviceA ? 3 : 2;
      const retained = [...model.relationships].slice(0, 2 + eventCount);
      assertReferences(model.eventOverview, [model.service, ...model.modules, ...retained, sharedTopic, exclusive]);
      expect([...model.relationships][2]?.to).toBe(sharedTopic);
      expect([...model.relationships].at(-1)?.to).toBe(database);
      for (const node of [...topics, ...databases]) expect(model.localModel).not.toContain(node);
      for (const omitted of [unrelatedTopic, ...databases, other.service, ...other.modules, [...model.relationships].at(-1)]) {
        expect(model.eventOverview).not.toContain(omitted);
      }
      expect(exportContext(model === serviceA ? 'Service A events' : 'Service B events', model.eventOverview)).toBe(expected);
    }
    assertReferences(connectedNodes(new Set([serviceA.service, serviceB.service]), eventFlow.is, 'outgoing'), [sharedTopic, topicA, topicB]);
  });

  it('freezes authored fixture exports and preserves all source state across 100 full derivations', () => {
    const collections = [topics, databases, serviceA.modules, serviceB.modules, serviceA.relationships, serviceB.relationships, serviceA.localModel, serviceB.localModel, serviceA.eventOverview, serviceB.eventOverview];
    const originals = collections.map(array => [...array]);
    const elements = [...new Set(collections.flatMap(collection => [...collection]))];
    const nodes = elements.filter((e): e is Node => e instanceof Node);
    const adjacency = nodes.map(n => [n.outgoing, n.incoming, n.edges]);
    for (const array of collections) {
      expect(Object.isFrozen(array)).toBe(true);
      expect(() => (array as Set<GraphElement>).clear()).toThrow();
    }
    for (const element of elements) {
      expect(Object.isFrozen(element)).toBe(true);
      expect(Reflect.set(element, 'extra', true)).toBe(false);
    }
    for (let i = 0; i < 100; i++) {
      const a = derive(serviceA.localModel), b = derive(serviceB.localModel);
      assertReferences(a, serviceA.eventOverview);
      assertReferences(b, serviceB.eventOverview);
      expect(exportContext('Service A events', a)).toBe(expectedA);
      expect(exportContext('Service B events', b)).toBe(expectedB);
    }
    collections.forEach((array, i) => assertReferences(array, originals[i]!));
    nodes.forEach((node, i) => {
      [node.outgoing, node.incoming, node.edges].forEach((edges, j) => assertReferences(edges, adjacency[i]![j]!));
    });
  });

  it('persists both diagrams with independently specified expected contents', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'service-overviews-'));
    try {
      for (const [name, overview, expected] of [
        ['Service A events', serviceA.eventOverview, expectedA],
        ['Service B events', serviceB.eventOverview, expectedB],
      ] as const) {
        const destination = path.join(directory, `${name}.mmd`);
        await saveDiagram(exportContext(name, overview), destination);
        expect(await readFile(destination, 'utf8')).toBe(expected);
      }
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
