import { defineElement, Node } from 'governed-model-core';
class Shared extends Node { constructor(id: string, public name: string) { super(id); } }
export const shared = defineElement(Shared)('shared', 'Shared');
