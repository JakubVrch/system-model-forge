import type { GraphElement } from '@core';
import { describeElement, kindOf, readData } from '@cli/source/graph-element';
import { CliError } from '@cli/errors';
import { ordinal } from '@cli/ordering';
import type { AttributeValue, ElementView, EndpointView, GroupResult, InspectionResult } from '@cli/commands/list-elements/result';
import type { SelectedExport } from '@cli/source/model';

type NormalizedElement = Omit<ElementView, 'endpoints'>;
type NormalizeElement = (value: unknown, selection: SelectedExport) => NormalizedElement;

function isAttributeValue(value: unknown): value is AttributeValue {
  return value == null || typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value));
}

function normalizeAttributes(value: unknown): Record<string, AttributeValue> {
  const method = readData(value, 'getElementInfo');
  if (typeof method !== 'function') throw new Error('requires getElementInfo()');
  const info: unknown = method.call(value);
  if (!info || typeof info !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(info))) {
    throw new Error('getElementInfo() must return a plain synchronous data record');
  }

  const attributes: Record<string, AttributeValue> = Object.create(null);
  for (const key of Object.keys(info).sort(ordinal)) {
    if (key === 'id' || key === 'name') continue;
    const descriptor = Object.getOwnPropertyDescriptor(info, key);
    if (!descriptor || !('value' in descriptor) || !isAttributeValue(descriptor.value)) {
      throw new Error(`invalid attribute ${JSON.stringify(key)}`);
    }
    attributes[key] = descriptor.value ?? null;
  }
  return attributes;
}

function normalizeElement(value: unknown, selection: SelectedExport): NormalizedElement {
  const id = readData(value, 'id');
  try {
    const kind = kindOf(value);
    const description = describeElement(value as GraphElement);
    return { kind, ...description, attributes: normalizeAttributes(value) };
  } catch (error) {
    const { partition, export: selectionExport } = selection;
    const identity = typeof id === 'string' ? JSON.stringify(id) : '(missing id)';
    const detail = error instanceof Error ? error.message : String(error);
    throw new CliError(
      `${partition.path}: ${selectionExport.group} ${JSON.stringify(selectionExport.key)}, element ${identity}: ${detail}`,
      { path: partition.path, partitionId: partition.id, exportGroup: selectionExport.group, exportKey: selectionExport.key },
    );
  }
}

function endpointView(
  edge: GraphElement, key: 'from' | 'to', selection: SelectedExport, normalize: NormalizeElement,
): EndpointView | null {
  const target = readData(edge, key);
  if (target == null) return null;
  const info = normalize(target, selection);
  if (info.kind !== 'node') {
    throw new CliError(`${selection.partition.path}: edge endpoint ${key} must be a node`, {
      path: selection.partition.path, exportKey: selection.export.key,
    });
  }
  const membership: ReadonlySet<unknown> = selection.members;
  return { modelType: info.modelType, identity: info.identity, inExport: membership.has(target) };
}

function projectElement(
  value: GraphElement, selection: SelectedExport, properties: ReadonlySet<string>, normalize: NormalizeElement,
): ElementView {
  const info = normalize(value, selection);
  const entries = Object.entries(info.attributes);
  const attributes = Object.fromEntries(properties.size ? entries.filter(([key]) => properties.has(key)) : entries);
  if (info.kind === 'node') return { ...info, kind: 'node', attributes };
  return {
    ...info,
    kind: 'edge',
    attributes,
    endpoints: {
      from: endpointView(value, 'from', selection, normalize),
      to: endpointView(value, 'to', selection, normalize),
    },
  };
}

function projectGroup(members: GraphElement[], toView: (member: GraphElement) => ElementView, limit?: number): GroupResult {
  const items = members.slice(0, limit).map(toView);
  return { total: members.length, returned: items.length, omitted: members.length - items.length, items };
}

export function inspectElements(selections: SelectedExport[], properties: string[], limit?: number): InspectionResult {
  const cache = new Map<unknown, NormalizedElement>();
  const normalize: NormalizeElement = (value, selection) => {
    const cached = cache.get(value);
    if (cached) return cached;
    const info = normalizeElement(value, selection);
    cache.set(value, info);
    return info;
  };

  const available = new Set<string>();
  for (const selection of selections) {
    for (const value of selection.members) {
      const { attributes } = normalize(value, selection);
      for (const key of Object.keys(attributes)) available.add(key);
    }
  }
  for (const key of properties) {
    if (!available.has(key)) {
      throw new CliError(`Unknown property ${JSON.stringify(key)}; available: ${[...available].sort(ordinal).join(', ') || '(none)'}`, { selector: key });
    }
  }

  const projected = new Set(properties);
  return {
    selections: selections.map(selection => {
      const members: Record<ElementView['kind'], GraphElement[]> = { node: [], edge: [] };
      for (const value of selection.members) members[normalize(value, selection).kind].push(value);
      const toView = (member: GraphElement) => projectElement(member, selection, projected, normalize);
      return {
        partition: selection.partition,
        export: selection.export,
        nodes: projectGroup(members.node, toView, limit),
        edges: projectGroup(members.edge, toView, limit),
      };
    }),
  };
}
