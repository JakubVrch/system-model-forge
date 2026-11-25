import { expect, it } from 'vitest';
import { formatTrace } from '@cli/commands/trace-element/format';

it('renders branch connectors, directions and escaped authored strings across roots', () => {
  const leaf = { modelType: null, id: 'leaf', name: 'Leaf', relationships: [] };
  const element = {
    modelType: 'Service', id: 'root', name: 'Root\n\x1b',
    relationships: [
      { modelType: 'Calls', id: 'call', name: 'Call', direction: 'To' as const, element: leaf },
      { modelType: 'Calls', id: 'reply', name: 'Reply', direction: 'From' as const, element: leaf },
    ],
  };
  expect(formatTrace({ roots: [element, leaf] })).toBe([
    'Service: Root\\n\\u001b (root)',
    '├── Calls: Call (call) -> To',
    '│   └── unknown: Leaf (leaf)',
    '└── Calls: Reply (reply) -> From',
    '    └── unknown: Leaf (leaf)',
    '',
    'unknown: Leaf (leaf)',
  ].join('\n'));
});
