export type EdgeLike = {
  readonly from?: object | undefined;
  readonly to?: object | undefined;
};

type AdjacencyEntry = {
  outgoing: EdgeLike[];
  incoming: EdgeLike[];
  connected: EdgeLike[];
};

const adjacency = new WeakMap<object, AdjacencyEntry>();

function getOrCreateEntry(node: object): AdjacencyEntry {
  let entry = adjacency.get(node);
  if (!entry) {
    entry = { outgoing: [], incoming: [], connected: [] };
    adjacency.set(node, entry);
  }
  return entry;
}

function appendUnique(list: EdgeLike[], edge: EdgeLike): void {
  if (!list.includes(edge)) {
    list.push(edge);
  }
}

export function registerOutgoing(edge: EdgeLike, node: object): void {
  const entry = getOrCreateEntry(node);
  entry.outgoing.push(edge);
  appendUnique(entry.connected, edge);
}

export function registerIncoming(edge: EdgeLike, node: object): void {
  const entry = getOrCreateEntry(node);
  entry.incoming.push(edge);
  appendUnique(entry.connected, edge);
}

export function getOutgoingEdges(node: object): readonly EdgeLike[] {
  return Object.freeze([...getOrCreateEntry(node).outgoing]);
}

export function getIncomingEdges(node: object): readonly EdgeLike[] {
  return Object.freeze([...getOrCreateEntry(node).incoming]);
}

export function getConnectedEdges(node: object): readonly EdgeLike[] {
  return Object.freeze([...getOrCreateEntry(node).connected]);
}
