import { readonlySet } from '../collection/readonly-set.ts';

export type EdgeLike = {
  readonly from?: object | undefined;
  readonly to?: object | undefined;
};

type AdjacencyEntry = {
  outgoing: Set<EdgeLike>;
  incoming: Set<EdgeLike>;
  connected: Set<EdgeLike>;
};

const adjacency = new WeakMap<object, AdjacencyEntry>();

function getOrCreateEntry(node: object): AdjacencyEntry {
  let entry = adjacency.get(node);
  if (!entry) {
    entry = { outgoing: new Set(), incoming: new Set(), connected: new Set() };
    adjacency.set(node, entry);
  }
  return entry;
}

export function registerOutgoing(edge: EdgeLike, node: object): void {
  const entry = getOrCreateEntry(node);
  entry.outgoing.add(edge);
  entry.connected.add(edge);
}

export function registerIncoming(edge: EdgeLike, node: object): void {
  const entry = getOrCreateEntry(node);
  entry.incoming.add(edge);
  entry.connected.add(edge);
}

export function getOutgoingEdges(node: object): ReadonlySet<EdgeLike> {
  return readonlySet(getOrCreateEntry(node).outgoing);
}

export function getIncomingEdges(node: object): ReadonlySet<EdgeLike> {
  return readonlySet(getOrCreateEntry(node).incoming);
}

export function getConnectedEdges(node: object): ReadonlySet<EdgeLike> {
  return readonlySet(getOrCreateEntry(node).connected);
}
