import type { ElementView, EndpointView, GroupResult, InspectionResult } from '@cli/commands/list-elements/result';
import { plain, UNKNOWN_MODEL_TYPE } from '@cli/output/format';

function table(headers: string[], rows: string[][]): string {
  const widths = headers.map(header => header.length);
  for (const row of rows) {
    row.forEach((value, column) => { widths[column] = Math.max(widths[column]!, value.length); });
  }
  const renderRow = (row: string[]) =>
    '  ' + row.map((value, column) => value.padEnd(widths[column]!)).join('  ').trimEnd();
  const heading = renderRow(headers);
  const rule = renderRow(widths.map(width => '─'.repeat(width)));
  return [heading, rule, ...rows.map(renderRow)].join('\n');
}

function endpointLabel(endpoint: EndpointView | null): string {
  if (!endpoint) return '(none)';
  const { identity, modelType, inExport } = endpoint;
  return `${identity.id} (${modelType ?? UNKNOWN_MODEL_TYPE}, name=${JSON.stringify(identity.name)})${inExport ? '' : ' (external)'}`;
}

function attributeCell(item: ElementView, key: string): string {
  if (!Object.hasOwn(item.attributes, key)) return '(missing)';
  return JSON.stringify(item.attributes[key]) ?? '(undefined)';
}

function elementRow(item: ElementView, keys: string[]): string[] {
  const cells = [item.identity.id, item.modelType ?? `(${UNKNOWN_MODEL_TYPE})`, item.identity.name];
  if (item.kind === 'edge') {
    cells.push(endpointLabel(item.endpoints.from), endpointLabel(item.endpoints.to));
  }
  for (const key of keys) cells.push(attributeCell(item, key));
  return cells.map(plain);
}

function formatGroup(kind: ElementView['kind'], group: GroupResult): string {
  const includeEndpoints = kind === 'edge';
  const label = includeEndpoints ? 'Edges' : 'Nodes';
  const counts = `${label}  ${group.returned} shown · ${group.total} total · ${group.omitted} omitted`;
  if (!group.items.length) return `${counts}\n  (empty)`;

  const metadata = ['ID', 'Type', 'Name'];
  if (includeEndpoints) metadata.push('From', 'To');
  const attributeNames = new Set<string>();
  for (const item of group.items) {
    for (const key of Object.keys(item.attributes)) attributeNames.add(key);
  }
  const keys = [...attributeNames].sort();
  const prefix = 'attribute:';
  const attributeHeadings = keys.map(key =>
    plain(metadata.includes(key) || key.startsWith(prefix) ? prefix + key : key));
  const rows = group.items.map(item => elementRow(item, keys));
  return `${counts}\n${table([...metadata, ...attributeHeadings], rows)}`;
}

export function formatElements(result: InspectionResult): string {
  if (!result.selections.length) return '(no exports)';
  return result.selections.map(({ partition, export: selection, nodes, edges }) => [
    `${plain(partition.name)}  ·  ${plain(partition.id)}\n  ${plain(partition.path)}  /  ${selection.group}: ${plain(JSON.stringify(selection.key))}`,
    formatGroup('node', nodes),
    formatGroup('edge', edges),
  ].join('\n\n')).join('\n\n');
}
