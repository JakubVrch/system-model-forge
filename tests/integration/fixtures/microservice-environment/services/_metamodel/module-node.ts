import { defineElement, Node } from 'governed-model-core';

class ModuleNode extends Node {
  public constructor(public readonly id: string, name: string) {
    super(id, name);
  }

  public override toNotation(): string {
    return `Component(${this.id}, "${this.name}")`;
  }
}

export const module = defineElement(ModuleNode);
export type { ModuleNode };
