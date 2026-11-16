import { defineElement, Edge } from '@core';
import type { ServiceNode } from './service-node.ts';
import type { ModuleNode } from './module-node.ts';

class ModuleComposition extends Edge {
  public constructor(from: ServiceNode, to: ModuleNode, public readonly label: string = 'contains') {
    super(from, to);
  }

  public override toNotation(): string {
    return `Rel(${(this.from as ServiceNode).id}, ${(this.to as ModuleNode).id}, "${this.label}")`;
  }
}

export const moduleComposition = defineElement(ModuleComposition);
export type { ModuleComposition };
