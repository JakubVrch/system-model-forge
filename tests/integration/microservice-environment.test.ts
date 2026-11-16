import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { exportDiagram, saveDiagram } from '@core';
import { serviceA, serviceB } from '@fixtures/microservice-environment';

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
    ['Service A events', serviceA.eventOverview, expectedA],
    ['Service B events', serviceB.eventOverview, expectedB],
  ] as const)('saves the expected diagram for %s', async (title, overview, expected) => {
    const directory = await mkdtemp(path.join(tmpdir(), 'service-overviews-'));

    try {
      const diagram = exportDiagram(overview, `C4Component\ntitle ${title}`, '');
      const destination = path.join(directory, 'events.mmd');

      await saveDiagram(diagram, destination);

      expect(await readFile(destination, 'utf8')).toBe(expected);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
