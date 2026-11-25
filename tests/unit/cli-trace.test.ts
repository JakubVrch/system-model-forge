import { expect, it } from 'vitest';
import { Edge, Node, definePartition, type GraphElement } from '@core';
import { traceElements } from '@cli/commands/trace-element/trace';
import { selectExports } from '@cli/source/select';
import { validResponse } from '@cli/source/ipc';
import { isTraceResponse } from '@cli/commands/trace-element/response';

function published(...members: GraphElement[]) {
  return selectExports([{
    entry: { path: 'model.partition.ts', absolutePath: '/model.partition.ts', parentPath: null },
    partition: definePartition({ id: 'model', name: 'Model', elements: { all: new Set(members) } }),
  }], [], []);
}

class Calls extends Edge {}
class Publishes extends Edge {}

it('orders direct connections by type and direction while preserving parallel edges', () => {
  const root = new Node('root', 'Root');
  const peer = new Node('peer', 'Peer');
  new Publishes(root, peer, 'event', 'Publishes');
  new Calls(peer, root, 'incoming', 'Incoming');
  new Calls(root, peer, 'parallel', 'Primary');
  new Calls(root, peer, 'parallel', 'Secondary');
  new Calls(root, undefined, 'missing', 'Missing');

  const result = traceElements(published(root), 'root');
  expect(result.roots[0]).toMatchObject({ id: 'root', name: 'Root', modelType: null });
  expect(result.roots[0]!.relationships.map(branch => [branch.id, branch.name, branch.direction])).toEqual([
    ['parallel', 'Primary', 'To'], ['parallel', 'Secondary', 'To'],
    ['incoming', 'Incoming', 'From'], ['event', 'Publishes', 'To'],
  ]);
  expect(result.roots[0]!.relationships.every(branch =>
    branch.element.id === 'peer' && branch.element.relationships.length === 0)).toBe(true);
});

it('traces published edge roots and skips missing endpoints', () => {
  const node = new Node('node', 'Node');
  const complete = new Calls(node, node, 'complete', 'Complete');
  const partial = new Calls(undefined, node, 'partial', 'Partial');
  const absent = new Calls(undefined, undefined, 'absent', 'Absent');
  const selections = published(complete, partial, absent);
  expect(traceElements(selections, 'complete').roots[0]!.relationships.map(branch => [branch.id, branch.direction]))
    .toEqual([['complete', 'To'], ['complete', 'From']]);
  expect(traceElements(selections, 'partial').roots[0]!.relationships.map(branch => branch.direction)).toEqual(['To']);
  expect(traceElements(selections, 'absent').roots[0]!.relationships).toEqual([]);
});

it('limits depth and keeps repeated nodes and edges local to their branch', () => {
  const root = new Node('root', 'Root');
  const middle = new Node('middle', 'Middle');
  const next = new Node('next', 'Next');
  const last = new Node('last', 'Last');
  const primary = new Calls(root, middle, 'primary', 'Primary');
  new Calls(root, middle, 'alternate', 'Alternate');
  new Calls(middle, next, 'next-edge', 'Next Edge');
  new Calls(next, last, 'last-edge', 'Last Edge');
  new Calls(root, root, 'self', 'Self');
  const selection = published(root, primary);
  const firstHop = (depth: number) => traceElements(selection, 'root', depth).roots[0]!.relationships;

  expect(firstHop(1).every(branch => branch.element.relationships.length === 0)).toBe(true);
  const middlePaths = firstHop(2).filter(branch => branch.element.id === 'middle');
  expect(middlePaths).toHaveLength(2);
  expect(middlePaths.map(branch => branch.element.relationships.map(relationship => relationship.id)))
    .toEqual([['next-edge', 'alternate'], ['next-edge', 'primary']]);
  expect(middlePaths[0]!.element.relationships[1]!.element).toMatchObject({ id: 'root', relationships: [] });

  const thirdHop = firstHop(3).find(branch => branch.id === 'primary')!.element.relationships[0]!.element;
  expect(thirdHop.relationships.map(branch => branch.element)).toMatchObject([{ id: 'last', relationships: [] }]);
  expect(firstHop(3).filter(branch => branch.id === 'self').map(branch => branch.direction)).toEqual(['To', 'From']);
  expect(firstHop(3).filter(branch => branch.id === 'self').every(branch => branch.element.relationships.length === 0)).toBe(true);

  const edgeRoot = traceElements(selection, 'primary', 2).roots[0]!;
  expect(edgeRoot.relationships.every(branch =>
    branch.element.relationships.every(relationship => relationship.id !== 'primary'))).toBe(true);
});

it('returns matching roots in encounter order, keeping distinct objects with equal IDs', () => {
  const shared = new Node(' same ', 'First');
  const distinct = new Node(' same ', 'Second');
  const selections = [...published(shared), ...published(shared, distinct)];

  expect(traceElements(selections, ' same ').roots.map(root => root.name)).toEqual(['First', 'Second']);
  expect(traceElements(published(distinct), ' same ').roots.map(root => root.name)).toEqual(['Second']);
  expect(() => traceElements(selections, 'same')).toThrow(/No published element matches ID "same"/);
  expect(() => traceElements(selections, ' Same ')).toThrow(/No published element matches ID " Same "/);
});

it('validates trace roots and nested branches from the source child', () => {
  const root = new Node('root', 'Root');
  new Calls(root, new Node('peer', 'Peer'), 'call', 'Call');
  const response = { kind: 'trace-element', data: traceElements(published(root), 'root') };
  expect(validResponse(response, isTraceResponse)).toBe(true);
  expect(validResponse({ kind: 'error', error: { message: 'Failed', context: {} } }, isTraceResponse)).toBe(true);
  expect(validResponse({ ...response, data: { roots: [] } }, isTraceResponse)).toBe(false);
  Reflect.set(response.data.roots[0]!.relationships[0]!, 'direction', 'Sideways');
  expect(validResponse(response, isTraceResponse)).toBe(false);
});
