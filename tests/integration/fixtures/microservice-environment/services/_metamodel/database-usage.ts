import { defineElement, Edge, type Endpoint } from 'governed-model-core';
import type { ServiceNode } from './service-node.ts';
import type { DatabaseNode } from '../../databases/databases.partition.ts';

class DatabaseUsage extends Edge<ServiceNode, DatabaseNode> {
  public constructor(from: Endpoint<ServiceNode>, to: Endpoint<DatabaseNode>, id: string, name: string) {
    super(from, to, id, name);
  }

  public override toNotation(): string {
    return `Rel(${this.from?.id}, ${this.to?.id}, "${this.name}")`;
  }
}

export const databaseUsage = defineElement(DatabaseUsage);
export type { DatabaseUsage };
