import { defineElement, Edge, type Endpoint } from 'governed-model-core';
import type { ServiceNode } from './service-node.ts';
import type { ModuleNode } from './module-node.ts';

class ModuleComposition extends Edge<ServiceNode, ModuleNode> {
  public constructor(from: Endpoint<ServiceNode>, to: Endpoint<ModuleNode>, id: string, name: string) {
    super(from, to, id, name);
  }

  public override toNotation(): string {
    return `Rel(${this.from?.id}, ${this.to?.id}, "${this.name}")`;
  }
}

export const moduleComposition = defineElement(ModuleComposition);
export type { ModuleComposition };
