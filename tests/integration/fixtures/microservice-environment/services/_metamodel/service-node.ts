import { defineElement, Node } from 'governed-model-core';

class ServiceNode extends Node {
  public constructor(public readonly id: string, name: string) {
    super(id, name);
  }

  public override toNotation(): string {
    return `Container(${this.id}, "${this.name}")`;
  }
}

export const service = defineElement(ServiceNode);
export type { ServiceNode };
