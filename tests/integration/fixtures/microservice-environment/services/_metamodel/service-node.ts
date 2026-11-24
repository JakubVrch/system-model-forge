import { defineElement, Node } from 'governed-model-core';

class ServiceNode extends Node {
  public constructor(public readonly id: string, public readonly name: string) {
    super(id);
  }

  public override toNotation(): string {
    return `Container(${this.id}, "${this.name}")`;
  }
}

export const service = defineElement(ServiceNode);
export type { ServiceNode };
