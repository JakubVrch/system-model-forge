import { defineElement, Node } from '@core';

class DatabaseNode extends Node {
  public constructor(public readonly id: string, public readonly name: string) {
    super(id);
  }

  public override toNotation(): string {
    return `SystemDb(${this.id}, "${this.name}")`;
  }
}

export const database = defineElement(DatabaseNode);
export type { DatabaseNode };
