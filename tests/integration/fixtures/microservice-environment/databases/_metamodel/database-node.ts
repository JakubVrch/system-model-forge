import { defineElement, Node } from 'governed-model-core';

class DatabaseNode extends Node {
  public constructor(public readonly id: string, name: string) {
    super(id, name);
  }

  public override toNotation(): string {
    return `SystemDb(${this.id}, "${this.name}")`;
  }
}

export const database = defineElement(DatabaseNode);
export type { DatabaseNode };
