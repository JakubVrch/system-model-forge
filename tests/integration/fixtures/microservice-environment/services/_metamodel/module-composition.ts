import { defineElement, Edge, type Endpoint } from '@core';
import type { ServiceNode } from './service-node.ts';
import type { ModuleNode } from './module-node.ts';

class ModuleComposition extends Edge<ServiceNode, ModuleNode> {
  public constructor(from: Endpoint<ServiceNode>, to: Endpoint<ModuleNode>, id: string, public readonly label: string = 'contains') {
    super(from, to, id);
  }

  public override toNotation(): string {
    return `Rel(${this.from?.id}, ${this.to?.id}, "${this.label}")`;
  }
}

export const moduleComposition = defineElement(ModuleComposition);
export type { ModuleComposition };
