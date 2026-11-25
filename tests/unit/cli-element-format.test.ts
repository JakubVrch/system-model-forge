import { expect, it } from 'vitest';
import { formatElements } from '@cli/commands/list-elements/format';
import type { InspectionResult } from '@cli/commands/list-elements/result';
it('renders full escaped values, union columns, missing cells, metadata, counts and empty groups', () => {
 const data: InspectionResult = { selections: [{ partition: { id: 'p', name: 'P', path: 'a' }, export: { group: 'elements', key: 'all' }, nodes: { total: 3, returned: 2, omitted: 1, items: [
 { kind: 'node', modelType: null, identity: { id: 'a', name: 'A' }, attributes: { ref: 'business', long: '漢字\n\x1b' + 'x'.repeat(300), zero: -0, empty: '', nil: null, undef: undefined } },
 { kind: 'node', modelType: 'Service', identity: { id: 'b', name: 'B' }, attributes: {} },
 ] }, edges: { total: 0, returned: 0, omitted: 0, items: [] } }] };
 const text = formatElements(data);
 for (const value of ['business', 'x'.repeat(300), '\\n', '(missing)', '(undefined)', 'null', '1 omitted', '(empty)', 'Service', '漢字']) expect(text).toContain(value);
 expect(text).not.toContain('\x1b');
});

it('retains descriptive endpoint types, zero counts, and unambiguous business headings', () => {
  const result: InspectionResult = { selections: [{
    partition: { id: 'p', name: 'P', path: 'p.partition.ts' }, export: { group: 'elements', key: 'all' },
    nodes: { total: 0, returned: 0, omitted: 0, items: [] },
    edges: { total: 2, returned: 2, omitted: 0, items: [{
      kind: 'edge', modelType: 'Calls', identity: { id: 'edge', name: 'Calls Service' },
      attributes: { ID: 'business-id', Type: 'business-type', Name: 'business-name', From: 'business-from', To: 'business-to' },
      endpoints: {
        from: { identity: { id: 'duplicate', name: 'Service' }, modelType: 'ExternalService', inExport: false },
        to: { identity: { id: 'duplicate', name: 'Local' }, modelType: null, inExport: true },
      },
    }, {
      kind: 'edge', modelType: 'Calls', identity: { id: 'absent-endpoints', name: 'No Endpoints' },
      attributes: {}, endpoints: { from: null, to: null },
    }] },
  }] };
  const text = formatElements(result);
  expect(text).toContain('Nodes  0 shown · 0 total · 0 omitted');
  expect(text).toContain('Edges  2 shown · 2 total · 0 omitted');
  expect(text).toContain('duplicate (ExternalService, name="Service") (external)');
  expect(text).toContain('duplicate (unknown, name="Local")');
  expect(text.match(/\(none\)/g)).toHaveLength(2);
  for (const key of ['ID', 'Type', 'Name', 'From', 'To']) expect(text).toContain(`attribute:${key}`);
});

it('renders large unlimited groups without spreading rows into function arguments', () => {
  const count = 150_000;
  const items = Array.from({ length: count }, (_, index) => ({
    kind: 'node' as const, modelType: null, identity: { id: String(index), name: 'Item' }, attributes: {},
  }));
  const text = formatElements({ selections: [{
    partition: { id: 'p', name: 'P', path: 'p.partition.ts' }, export: { group: 'elements', key: 'all' },
    nodes: { total: count, returned: count, omitted: 0, items },
    edges: { total: 0, returned: 0, omitted: 0, items: [] },
  }] });
  expect(text).toContain('149999');
  expect(text).toContain('150000 total');
});
