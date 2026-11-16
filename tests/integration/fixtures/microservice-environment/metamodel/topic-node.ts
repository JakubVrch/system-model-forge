import { defineElement, Node } from '@core';

class TopicNode extends Node {
  public constructor(public readonly id: string, public readonly name: string) {
    super();
  }

  public override toNotation(): string {
    return `SystemQueue(${this.id}, "${this.name}")`;
  }
}

export const topic = defineElement(TopicNode);
export type { TopicNode };
