import { LIST_ELEMENTS_COMMAND } from '@cli/arguments/options';
import { DIAGRAM_EXPORT_GROUP, ELEMENT_EXPORT_GROUP } from '@cli/source/model';
import type { ListElementsSourceResult } from '@cli/commands/list-elements/result';
import type { ElementView } from '@cli/commands/list-elements/result';
import { hasStrings, isCount, isModelType, isPartitionIdentity, isRecord } from '@cli/source/ipc';

function isAttribute(value: unknown): boolean {
  return value === null || typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value));
}

function isIdentity(value: unknown): boolean {
  return isRecord(value) && hasStrings(value, ['id', 'name']) && Object.keys(value).length === 2;
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

function isSelection(value: unknown): boolean {
  if (!isRecord(value) || !isPartitionIdentity(value.partition) || !isRecord(value.export)) return false;
  const { group, key } = value.export;
  return (group === ELEMENT_EXPORT_GROUP || group === DIAGRAM_EXPORT_GROUP) && typeof key === 'string'
    && isGroup(value.nodes, 'node') && isGroup(value.edges, 'edge');
}

export function isListElementsResponse(value: unknown): value is ListElementsSourceResult {
  return isRecord(value) && value.kind === LIST_ELEMENTS_COMMAND
    && isRecord(value.data) && Array.isArray(value.data.selections) && value.data.selections.every(isSelection);
}
