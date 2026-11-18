import { expect, it } from 'vitest';
import { formatElements } from '../../src/cli/format.ts';
import type { InspectionResult } from '../../src/cli/result.ts';
it('renders full escaped values, union columns, missing cells, metadata, counts and empty groups', () => {
 const data: InspectionResult = { selections: [{ partition: { id: 'p', name: 'P', path: 'a' }, export: { group: 'elements', key: 'all' }, nodes: { total: 3, returned: 2, omitted: 1, items: [
 { ref: 'e1', kind: 'node', modelType: null, identity: { id: 'a' }, attributes: { ref: 'business', long: '漢字\n\x1b' + 'x'.repeat(300), zero: -0, empty: '', nil: null, undef: undefined } },
 { ref: 'e2', kind: 'node', modelType: 'Service', identity: { id: 'b' }, attributes: {} },
 ] }, edges: { total: 0, returned: 0, omitted: 0, items: [] } }] };
 const text = formatElements(data);
 for (const value of ['business', 'x'.repeat(300), '\\n', '(missing)', '(undefined)', 'null', 'omitted=1', '(empty)', 'Service', '漢字']) expect(text).toContain(value);
 expect(text).not.toContain('\x1b');
});
