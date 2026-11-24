import {
  DIAGRAM_EXPORT_GROUP, ELEMENT_EXPORT_GROUP, IDENTITY_ATTRIBUTE_KEYS,
  type BuildSummary, type ElementView, type EndpointView, type ExportCounts, type ExportGroup,
  type GroupResult, type Identity, type InspectionResult, type InventoryResult,
} from '@cli/result';

/** Escape controls without silently truncating authored values or interpreting ANSI. */
export function plain(value: string): string {
  return value.replace(/[\x00-\x1f\x7f-\x9f]/g, c => JSON.stringify(c).slice(1, -1).replace(c, `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`));
}
export function formatBuild(summary: BuildSummary): string {
  const lines = summary.partitions.map(p => `${plain(p.path)} (${plain(p.id)}; ${plain(p.name)}): ${p.diagrams.length ? p.diagrams.map(key => plain(JSON.stringify(key))).join(', ') : '(no diagrams)'}`);
  if (summary.dryRun) {
    lines.unshift('Dry run');
    for (const artifact of summary.artifacts ?? []) lines.push(`${plain(artifact.partitionPath)} / ${plain(JSON.stringify(artifact.diagramKey))} -> ${plain(artifact.path)}`);
    lines.push(`Planned files: ${summary.plannedFiles ?? 0}`);
  }
  lines.push(`Exported files: ${summary.exportedFiles}`);
  return lines.join('\n');
}

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

const unknownType = 'unknown';

function identityLabel(identity: Identity): string {
  for (const key of IDENTITY_ATTRIBUTE_KEYS) {
    const value = identity[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return identity.id;
}

function endpointLabel(endpoint: EndpointView | null): string {
  if (!endpoint) return '(none)';
  const details = [endpoint.modelType ?? unknownType];
  for (const key of IDENTITY_ATTRIBUTE_KEYS) {
    if (Object.hasOwn(endpoint.identity, key)) {
      details.push(`${key}=${JSON.stringify(endpoint.identity[key]) ?? '(undefined)'}`);
    }
  }
  return `${endpoint.identity.id} (${details.join(', ')})${endpoint.inExport ? '' : ' (external)'}`;
}

function attributeCell(item: ElementView, key: string): string {
  if (!Object.hasOwn(item.attributes, key)) return '(missing)';
  return JSON.stringify(item.attributes[key]) ?? '(undefined)';
}

function elementRow(item: ElementView, keys: string[]): string[] {
  const cells = [item.identity.id, item.modelType ?? `(${unknownType})`, identityLabel(item.identity)];
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

function formatExportCounts(group: ExportGroup, exports: ExportCounts[]): string[] {
  if (!exports.length) return [`${group}:`, '  (empty)'];
  const entries = exports.map(entry => {
    const label = plain(JSON.stringify(entry.key));
    const extension = 'fileExtension' in entry ? ` extension=${plain(String(entry.fileExtension))}` : '';
    return `  ${label}: nodes=${entry.nodes} edges=${entry.edges}${extension}`;
  });
  return [`${group}:`, ...entries];
}

export function formatInventory(result: InventoryResult): string {
  if (!result.partitions.length) return '(no partitions)';
  return result.partitions.map(partition => {
    const { path, id, name, parent, exports } = partition;
    const metamodel = exports.metamodel.map(key => plain(JSON.stringify(key))).join(', ');
    return [
      `${plain(path)} (${plain(id)}; ${plain(name)})`,
      `Parent: ${parent ? plain(JSON.stringify(parent)) : '(none)'}`,
      ...formatExportCounts(ELEMENT_EXPORT_GROUP, exports.elements),
      ...formatExportCounts(DIAGRAM_EXPORT_GROUP, exports.diagrams),
      `metamodel: ${exports.metamodel.length ? metamodel : '(empty)'}`,
    ].join('\n');
  }).join('\n\n');
}
