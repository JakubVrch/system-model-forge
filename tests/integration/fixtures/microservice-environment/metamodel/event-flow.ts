import { defineElement, Edge } from '@core';
import type { ServiceNode } from './service-node.ts';
import type { TopicNode } from './topic-node.ts';

class EventFlow extends Edge {
  public constructor(from: ServiceNode, to: TopicNode, public readonly kind: 'publish' | 'subscribe') {
    super(from, to);
  }

  public override toNotation(): string {
    return `Rel(${(this.from as ServiceNode).id}, ${(this.to as TopicNode).id}, "${this.kind}")`;
  }
}

export const eventFlow = defineElement(EventFlow);
export type { EventFlow };
