import { defineElement, Edge } from '@core';
import type { ServiceNode } from './service-node.ts';
import type { DatabaseNode } from './database-node.ts';

class DatabaseUsage extends Edge {
  public constructor(from: ServiceNode, to: DatabaseNode, public readonly label: string = 'uses') {
    super(from, to);
  }

  public override toNotation(): string {
    return `Rel(${(this.from as ServiceNode).id}, ${(this.to as DatabaseNode).id}, "${this.label}")`;
  }
}

export const databaseUsage = defineElement(DatabaseUsage);
export type { DatabaseUsage };
