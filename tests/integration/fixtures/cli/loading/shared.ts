import { defineElement, Node } from 'governed-model-core';
class Shared extends Node { constructor(id: string, name: string) { super(id, name); } }
export const shared = defineElement(Shared)('shared', 'Shared');
