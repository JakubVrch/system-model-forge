import { expect, it } from 'vitest';
import { runCli } from './cli-helpers.ts';

const root = 'tests/integration/fixtures/microservice-environment';

it('traces Service A with parallel edges and an imported database endpoint', async () => {
  const result = await runCli(['trace-element', 'serviceA', '--root', root, '--partition-id', 'service-a']);
  expect(result.status).toBe(0);
  const lines = result.stdout.trimEnd().split('\n');
  expect(lines[0]).toBe('ServiceNode: Service A (serviceA)');
  expect(lines).toEqual(expect.arrayContaining([
    '├── DatabaseUsage: uses (service-a-uses-database) -> To',
    '│   └── DatabaseNode: Database A (databaseA)',
    '├── EventFlow: publish (service-a-publishes-shared) -> To',
    '├── EventFlow: subscribe (service-a-subscribes-shared) -> To',
  ]));
  expect(lines.filter(line => line.includes('(shared)'))).toHaveLength(2);
  expect(lines).toHaveLength(13);
});

it('follows the shared topic into both services at depth two in a single JSON result', async () => {
  const result = await runCli(['trace-element', 'shared', '--root', root, '--depth', '2', '--format', 'json']);
  expect(result.status).toBe(0);
  expect(result.stderr).toBe('');
  const doc = JSON.parse(result.stdout);
  expect(doc).toMatchObject({ schemaVersion: 1, command: 'trace-element', success: true, error: null });
  expect(doc.data.roots).toHaveLength(1);
  const [topic] = doc.data.roots;
  expect(topic).toMatchObject({ id: 'shared', name: 'Shared topic', modelType: 'TopicNode' });
  expect(topic.relationships.map((branch: { direction: string }) => branch.direction)).toEqual(['From', 'From', 'From']);
  expect(topic.relationships.map((branch: { element: { id: string } }) => branch.element.id).sort())
    .toEqual(['serviceA', 'serviceA', 'serviceB']);
  for (const { element } of topic.relationships) {
    expect(element.relationships.length).toBeGreaterThan(0);
    for (const branch of element.relationships) expect(branch.element.relationships).toEqual([]);
  }
});
