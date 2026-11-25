import { DIAGRAM_EXPORT_GROUP, ELEMENT_EXPORT_GROUP, type ExportGroup } from '@cli/source/model';
import type { ExportCounts, InventoryResult } from '@cli/commands/partition-info/result';
import { plain } from '@cli/output/format';

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
