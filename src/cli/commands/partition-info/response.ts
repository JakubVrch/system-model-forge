import { PARTITION_INFO_COMMAND } from '@cli/arguments/options';
import type { PartitionInfoSourceResult } from '@cli/commands/partition-info/result';
import { isCount, isPartitionIdentity, isRecord } from '@cli/source/ipc';

function hasOptionalStrings(value: Record<string, unknown>, keys: string[]): boolean {
  return keys.every(key => !(key in value) || typeof value[key] === 'string');
}

function isParent(value: unknown): boolean {
  return value === null || (isRecord(value) && typeof value.path === 'string' && hasOptionalStrings(value, ['id', 'name']));
}

function isExportCount(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && typeof value.key === 'string' && isCount(value.nodes) && isCount(value.edges);
}

function isPartitionInventory(value: unknown): boolean {
  if (!isPartitionIdentity(value) || !isParent(value.parent) || !isRecord(value.exports)) return false;
  const { elements, diagrams, metamodel } = value.exports;
  return Array.isArray(elements) && elements.every(isExportCount)
    && Array.isArray(diagrams) && diagrams.every(entry => isExportCount(entry) && typeof entry.fileExtension === 'string')
    && Array.isArray(metamodel) && metamodel.every(key => typeof key === 'string');
}

export function isPartitionInfoResponse(value: unknown): value is PartitionInfoSourceResult {
  return isRecord(value) && value.kind === PARTITION_INFO_COMMAND
    && isRecord(value.data) && Array.isArray(value.data.partitions) && value.data.partitions.every(isPartitionInventory);
}
