import type { BuildSummary } from './result.ts';

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
  const widths = headers.map((header, i) => Math.max(header.length, ...rows.map(row => row[i]?.length ?? 0)));
  const render = (row: string[]) => row.map((value, i) => value.padEnd(widths[i] ?? value.length)).join('  ').trimEnd();
  return [render(headers), render(widths.map(width => '─'.repeat(width))), ...rows.map(render)].join('\n');
}
function identityLabel(identity: import('./result.ts').Identity): string {
  const label = [identity.name, identity.label].find(value => typeof value === 'string' && value.length > 0);
  return typeof label === 'string' ? label : identity.id;
}
function endpointLabel(endpoint: import('./result.ts').EndpointView | null): string {
  if (!endpoint) return '(none)';
  return `${endpoint.ref} ${identityLabel(endpoint.identity)}${endpoint.inExport ? '' : ' (external)'}`;
}
export function formatElements(result: import('./result.ts').InspectionResult): string {
  if (!result.selections.length) return '(no exports)';
  return result.selections.map(selection => {
    const lines = [`${plain(selection.partition.name)}  ·  ${plain(selection.partition.id)}`, `  ${plain(selection.partition.path)}  /  ${selection.export.group}: ${plain(JSON.stringify(selection.export.key))}`];
    for (const kind of ['nodes', 'edges'] as const) {
      const group = selection[kind];
      lines.push('', `${kind === 'nodes' ? 'Nodes' : 'Edges'}  ${group.returned} shown · ${group.total} total${group.omitted ? ` · ${group.omitted} omitted` : ''}`);
      if (!group.items.length) { lines.push('  (empty)'); continue; }
      const keys = [...new Set(group.items.flatMap(item => Object.keys(item.attributes)))].sort();
      const headers = ['Ref', 'Type', 'ID', 'Name', ...(kind === 'edges' ? ['From', 'To'] : []), ...keys.map(plain)];
      const rows = group.items.map(item => [item.ref, item.modelType ?? '(unknown)', item.identity.id, identityLabel(item.identity), ...(kind === 'edges' ? [endpointLabel(item.endpoints?.from ?? null), endpointLabel(item.endpoints?.to ?? null)] : []), ...keys.map(key => !Object.hasOwn(item.attributes, key) ? '—' : item.attributes[key] === undefined ? '(undefined)' : JSON.stringify(item.attributes[key]))].map(plain));
      lines.push(table(headers, rows).split('\n').map(line => `  ${line}`).join('\n'));
    }
    return lines.join('\n');
  }).join('\n\n');
}

export function formatInventory(result: import('./result.ts').InventoryResult): string {
  if (!result.partitions.length) return '(no partitions)';
  return result.partitions.map(p => [
    `${plain(p.path)} (${plain(p.id)}; ${plain(p.name)})`,
    `Parent: ${p.parent ? plain(JSON.stringify(p.parent)) : '(none)'}`,
    ...(['elements', 'diagrams'] as const).flatMap(group => [group + ':', ...(p.exports[group].length ? p.exports[group].map(e => `  ${plain(JSON.stringify(e.key))}: nodes=${e.nodes} edges=${e.edges}${'fileExtension' in e ? ` extension=${plain(e.fileExtension)}` : ''}`) : ['  (empty)'])]),
    `metamodel: ${p.exports.metamodel.length ? p.exports.metamodel.map(k => plain(JSON.stringify(k))).join(', ') : '(empty)'}`,
  ].join('\n')).join('\n\n');
}
