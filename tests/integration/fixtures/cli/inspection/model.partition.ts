import { Node, Edge, definePartition } from 'governed-model-core';
class Service extends Node { constructor(id: string, name: string) { super(id, name); } score = 0; }
class Calls extends Edge {
  ID = 'business-id';
  Type = 'business-type';
  Name = 'business-name';
  From = 'business-from';
  To = 'business-to';
  ref = 'authored-ref';
  hiddenByProjection = 'omitted attribute';
}
const nodes = Array.from({ length: 5 }, (_, i) => new Service(i < 2 ? 'duplicate' : `n${i}`, `Service ${i}`));
const external = new Service('external', 'Outside');
const edges = [new Calls(nodes[0], nodes[4], 'e0', 'Calls Service'), new Calls(external, nodes[0], 'e1', 'Calls From Outside'), new Calls(undefined, undefined, 'e2', 'Missing Ends')];
export const partition = definePartition({ id: 'inspection', name: 'Inspection', elements: { all: new Set([...nodes, ...edges]), edges: new Set(edges), empty: new Set<Node>() }, diagrams: { all: { data: new Set([nodes[0]!]), inNotation: 'exact', fileExtension: '.txt' } } });
