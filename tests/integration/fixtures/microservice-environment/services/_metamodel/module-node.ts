import { defineElement, Node } from '@core';

class ModuleNode extends Node {
  public constructor(public readonly id: string, public readonly name: string) {
    super(id);
  }

  public override toNotation(): string {
    return `Component(${this.id}, "${this.name}")`;
  }
}

export const module = defineElement(ModuleNode);
export type { ModuleNode };
