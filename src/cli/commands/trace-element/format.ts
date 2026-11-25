import type { TraceElement, TraceResult } from '@cli/commands/trace-element/result';
import { plain, UNKNOWN_MODEL_TYPE } from '@cli/output/format';

export function formatTrace({ roots }: TraceResult): string {
  const lines: string[] = [];
  const identity = ({ modelType, name, id }: Pick<TraceElement, 'modelType' | 'name' | 'id'>) =>
    plain(`${modelType ?? UNKNOWN_MODEL_TYPE}: ${name} (${id})`);

  function appendRelationships(element: TraceElement, prefix: string): void {
    element.relationships.forEach((branch, index) => {
      const last = index === element.relationships.length - 1;
      lines.push(`${prefix}${last ? '└── ' : '├── '}${identity(branch)} -> ${branch.direction}`);
      const childPrefix = prefix + (last ? '    ' : '│   ');
      lines.push(`${childPrefix}└── ${identity(branch.element)}`);
      appendRelationships(branch.element, childPrefix + '    ');
    });
  }

  roots.forEach((root, index) => {
    if (index > 0) lines.push('');
    lines.push(identity(root));
    appendRelationships(root, '');
  });
  return lines.join('\n');
}
