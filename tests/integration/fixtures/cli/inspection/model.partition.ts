import { Node, Edge, definePartition } from '@core';
class Service extends Node { constructor(id: string, readonly name: string) { super(id); } score = 0; }
class Calls extends Edge {}
const nodes = Array.from({ length: 5 }, (_, i) => new Service(i < 2 ? 'duplicate' : `n${i}`, `Service ${i}`));
const external = new Service('external', 'Outside');
const edges = [new Calls(nodes[0], nodes[4], 'e0'), new Calls(external, nodes[0], 'e1'), new Calls(undefined, undefined, 'e2')];
export const partition = definePartition({ id: 'inspection', name: 'Inspection', elements: { all: new Set([...nodes, ...edges]), edges: new Set(edges), empty: new Set<Node>() }, diagrams: { all: { data: new Set([nodes[0]!]), inNotation: 'exact', fileExtension: '.txt' } } });
