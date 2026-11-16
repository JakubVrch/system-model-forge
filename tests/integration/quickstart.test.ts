import { describe, expect, it } from 'vitest';
import { serviceA, serviceB, sharedTopic, topicA, topicB, databases } from '@fixtures/microservice-environment';

describe('quickstart', () => {
  it.each([
    ['Service A', serviceA, topicA],
    ['Service B', serviceB, topicB],
  ] as const)('%s exports its model and event overview', (_name, model, exclusiveTopic) => {
    expect(model.modules.size).toBe(2);
    expect(model.localModel.has(model.service)).toBe(true);
    expect(model.eventOverview.has(model.service)).toBe(true);
    expect(model.eventOverview.has(sharedTopic)).toBe(true);
    expect(model.eventOverview.has(exclusiveTopic)).toBe(true);
    for (const database of databases) expect(model.eventOverview.has(database)).toBe(false);
  });
});
