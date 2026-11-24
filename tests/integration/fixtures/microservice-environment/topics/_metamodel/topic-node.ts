import { defineElement, Node } from 'governed-model-core';

class TopicNode extends Node {
  public constructor(public readonly id: string, public readonly name: string) {
    super(id);
  }

  public override toNotation(): string {
    return `SystemQueue(${this.id}, "${this.name}")`;
  }
}

export const topic = defineElement(TopicNode);
export type { TopicNode };
