import { BUILD_COMMAND, LIST_ELEMENTS_COMMAND, PARTITION_INFO_COMMAND } from '@cli/arguments/options';
import {
  CHILD_ERROR_KIND, DIAGRAM_EXPORT_GROUP, ELEMENT_EXPORT_GROUP, IDENTITY_ATTRIBUTE_KEYS,
  type ChildResponse, type ElementView,
} from '@cli/result';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasStrings(value: Record<string, unknown>, keys: string[]): boolean {
  return keys.every(key => typeof value[key] === 'string');
}

function hasOptionalStrings(value: Record<string, unknown>, keys: string[]): boolean {
  return keys.every(key => !(key in value) || typeof value[key] === 'string');
}

function isAttribute(value: unknown): boolean {
  return value === null || typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value));
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isModelType(value: unknown): boolean {
  return value === null || typeof value === 'string';
}

function isIdentity(value: unknown): boolean {
  return isRecord(value) && typeof value.id === 'string'
    && IDENTITY_ATTRIBUTE_KEYS.every(key => !(key in value) || isAttribute(value[key]));
}

function isEndpoint(value: unknown): boolean {
  return value === null || (
    isRecord(value) && isModelType(value.modelType) && isIdentity(value.identity)
    && typeof value.inExport === 'boolean'
  );
}

function isElement(value: unknown, kind: ElementView['kind']): boolean {
  if (!isRecord(value) || value.kind !== kind || !isModelType(value.modelType)
      || !isIdentity(value.identity) || !isRecord(value.attributes)
      || !Object.values(value.attributes).every(isAttribute)) return false;

  if (kind === 'node') return !('endpoints' in value);
  return isRecord(value.endpoints) && isEndpoint(value.endpoints.from) && isEndpoint(value.endpoints.to);
}

function isGroup(value: unknown, kind: ElementView['kind']): boolean {
  if (!isRecord(value)) return false;
  const { total, returned, omitted, items } = value;
  return isCount(total) && isCount(returned) && isCount(omitted) && Array.isArray(items)
    && items.length === returned && returned + omitted === total
    && items.every(item => isElement(item, kind));
}

function isPartitionIdentity(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && hasStrings(value, ['id', 'name', 'path']);
}

function isSelection(value: unknown): boolean {
  if (!isRecord(value) || !isPartitionIdentity(value.partition) || !isRecord(value.export)) return false;
  const { group, key } = value.export;
  return (group === ELEMENT_EXPORT_GROUP || group === DIAGRAM_EXPORT_GROUP) && typeof key === 'string'
    && isGroup(value.nodes, 'node') && isGroup(value.edges, 'edge');
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

function isPlannedPartition(value: unknown): boolean {
  return isPartitionIdentity(value) && Array.isArray(value.artifacts) && value.artifacts.every(artifact =>
    isRecord(artifact) && hasStrings(artifact, ['partitionPath', 'diagramKey', 'path', 'text'])
    && artifact.partitionPath === value.path);
}

export function validResponse(value: unknown): value is ChildResponse {
  if (!isRecord(value)) return false;
  switch (value.kind) {
    case CHILD_ERROR_KIND:
      return isRecord(value.error) && typeof value.error.message === 'string' && isRecord(value.error.context)
        && Object.values(value.error.context).every(entry => typeof entry === 'string');
    case LIST_ELEMENTS_COMMAND:
      return isRecord(value.data) && Array.isArray(value.data.selections) && value.data.selections.every(isSelection);
    case PARTITION_INFO_COMMAND:
      return isRecord(value.data) && Array.isArray(value.data.partitions) && value.data.partitions.every(isPartitionInventory);
    case BUILD_COMMAND:
      return isRecord(value.plan) && Array.isArray(value.plan.partitions) && value.plan.partitions.every(isPlannedPartition);
    default:
      return false;
  }
}
