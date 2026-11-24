import { defineElement, Edge, type Endpoint } from 'governed-model-core';
import type { ServiceNode } from './service-node.ts';
import type { TopicNode } from '../../topics/topics.partition.ts';

class EventFlow extends Edge<ServiceNode, TopicNode> {
  public constructor(from: Endpoint<ServiceNode>, to: Endpoint<TopicNode>, id: string, public readonly kind: 'publish' | 'subscribe') {
    super(from, to, id);
  }

  public override toNotation(): string {
    return `Rel(${this.from?.id}, ${this.to?.id}, "${this.kind}")`;
  }
}

export const eventFlow = defineElement(EventFlow);
export type { EventFlow };
