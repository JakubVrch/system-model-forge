import { defineElement, Edge, type Endpoint } from '@core';
import type { ServiceNode } from './service-node.ts';
import type { DatabaseNode } from '../../databases/databases.partition.ts';

class DatabaseUsage extends Edge<ServiceNode, DatabaseNode> {
  public constructor(from: Endpoint<ServiceNode>, to: Endpoint<DatabaseNode>, id: string, public readonly label: string = 'uses') {
    super(from, to, id);
  }

  public override toNotation(): string {
    return `Rel(${this.from?.id}, ${this.to?.id}, "${this.label}")`;
  }
}

export const databaseUsage = defineElement(DatabaseUsage);
export type { DatabaseUsage };
