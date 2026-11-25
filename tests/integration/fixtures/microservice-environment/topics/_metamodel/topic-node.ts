import { defineElement, Node } from 'governed-model-core';

class TopicNode extends Node {
  public constructor(public readonly id: string, name: string) {
    super(id, name);
  }

  public override toNotation(): string {
    return `SystemQueue(${this.id}, "${this.name}")`;
  }
}

export const topic = defineElement(TopicNode);
export type { TopicNode };
