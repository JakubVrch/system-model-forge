import { defineElement, Node, graphKind } from '@core';
const { graphKind: compiledKind } = await import(new URL('../../../../../dist/core/index.js', import.meta.url).href);
class Shared extends Node { constructor(id: string, public name: string) { super(id); } }
export const shared = defineElement(Shared)('shared', 'Shared');
if ((graphKind as symbol) !== compiledKind || Object.getOwnPropertyDescriptor(Node.prototype, compiledKind)?.value.kind !== 'node') throw new Error('source/compiled graph protocol mismatch');
