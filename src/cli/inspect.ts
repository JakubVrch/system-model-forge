import { graphKind } from '../core/index.ts';
import { CliError, ordinal, type AttributeValue, type ElementView, type Identity, type InspectionResult, type SelectedExport } from './result.ts';

/** Read inherited data descriptors without evaluating authored getters. */
function data(value: unknown, key: PropertyKey): unknown {
  if ((typeof value !== 'object' || value === null) && typeof value !== 'function') return undefined;
  for (let current = value; current !== null; current = Object.getPrototypeOf(current)) {
    const descriptor = Object.getOwnPropertyDescriptor(current, key);
    if (descriptor) return 'value' in descriptor ? descriptor.value : undefined;
  }
  return undefined;
}
export function kindOf(value: unknown): 'node' | 'edge' {
  const protocol = data(value, graphKind);
  const kind = data(protocol, 'kind');
  if (data(protocol, 'version') !== 1 || (kind !== 'node' && kind !== 'edge')) throw new CliError('Invalid graph kind or unsupported protocol version');
  return kind;
}
function modelType(value: object): string | null {
  const name = data(data(Object.getPrototypeOf(value), 'constructor'), 'name');
  return typeof name === 'string' && name && !['Node', 'Edge', 'Object'].includes(name) ? name : null;
}
export function inspectElements(selections: SelectedExport[], properties: string[], limit?: number): InspectionResult {
  const cache = new Map<object, { kind: 'node' | 'edge'; modelType: string | null; identity: Identity; attributes: Record<string, AttributeValue> }>();
  const refs = new Map<object, string>();
  const ref = (value: object) => { if (!refs.has(value)) refs.set(value, `e${refs.size + 1}`); return refs.get(value)!; };
  function normalize(value: object, selection: SelectedExport) {
    const cached = cache.get(value); if (cached) return cached;
    const id = data(value, 'id');
    try {
      const kind = kindOf(value);
      if (typeof id !== 'string') throw new Error('requires string id');
      const method = data(value, 'getElementInfo');
      if (typeof method !== 'function') throw new Error('requires getElementInfo()');
      const info: unknown = method.call(value);
      if (!info || typeof info !== 'object' || ![Object.prototype, null].includes(Object.getPrototypeOf(info))) throw new Error('getElementInfo() must return a plain synchronous data record');
      const attributes: Record<string, AttributeValue> = Object.create(null);
      for (const key of Object.keys(info).sort(ordinal)) {
        const descriptor = Object.getOwnPropertyDescriptor(info, key)!;
        const v: unknown = descriptor.value;
        if (!('value' in descriptor) || !(v == null || typeof v === 'string' || (typeof v === 'number' && Number.isFinite(v)))) throw new Error(`invalid attribute ${JSON.stringify(key)}`);
        attributes[key] = v === undefined ? null : v as AttributeValue;
      }
      const identity: Identity = { id };
      for (const key of ['name', 'label'] as const) if (Object.hasOwn(attributes, key)) identity[key] = attributes[key];
      const result = { kind, modelType: modelType(value), identity, attributes }; cache.set(value, result); return result;
    } catch (error) {
      throw new CliError(`${selection.partition.path}: ${selection.export.group} ${JSON.stringify(selection.export.key)}, element ${typeof id === 'string' ? JSON.stringify(id) : '(missing id)'}: ${error instanceof Error ? error.message : String(error)}`, { path: selection.partition.path, partitionId: selection.partition.id, exportGroup: selection.export.group, exportKey: selection.export.key });
    }
  }
  const available = new Set<string>();
  for (const selection of selections) for (const value of selection.members) for (const key of Object.keys(normalize(value, selection).attributes)) available.add(key);
  for (const key of properties) if (!available.has(key)) throw new CliError(`Unknown property ${JSON.stringify(key)}; available: ${[...available].sort(ordinal).join(', ') || '(none)'}`, { selector: key });
  return { selections: selections.map(selection => {
    function view(value: object): ElementView {
      const info = normalize(value, selection);
      const attributes = Object.fromEntries(Object.entries(info.attributes).filter(([key]) => !properties.length || properties.includes(key)));
      const result: ElementView = { ref: ref(value), ...info, attributes };
      if (info.kind === 'edge') {
        const endpoint = (key: 'from' | 'to') => {
          const target = data(value, key);
          if (target == null) return null;
          const targetInfo = normalize(target as object, selection);
          if (targetInfo.kind !== 'node') throw new CliError(`${selection.partition.path}: edge endpoint ${key} must be a node`, { path: selection.partition.path, exportKey: selection.export.key });
          return { ref: ref(target as object), modelType: targetInfo.modelType, identity: targetInfo.identity, inExport: selection.members.has(target as never) };
        };
        result.endpoints = { from: endpoint('from'), to: endpoint('to') };
      }
      return result;
    }
    const group = (kind: 'node' | 'edge') => {
      const members = [...selection.members].filter(value => normalize(value, selection).kind === kind);
      const items = members.slice(0, limit).map(view);
      return { total: members.length, returned: items.length, omitted: members.length - items.length, items };
    };
    return { partition: selection.partition, export: selection.export, nodes: group('node'), edges: group('edge') };
  }) };
}

export function partitionInfo(selected: import('./result.ts').LoadedCandidate[], loaded: import('./result.ts').LoadedCandidate[]): import('./result.ts').InventoryResult {
  return { partitions: [...selected].sort((a, b) => ordinal(a.entry.path, b.entry.path)).map(candidate => {
    const { partition, entry } = candidate;
    function counts(members: ReadonlySet<object>, key: string) {
      let nodes = 0, edges = 0;
      try { for (const member of members) { if (kindOf(member) === 'node') nodes++; else edges++; } }
      catch (error) { throw new CliError(`${entry.path}: export ${JSON.stringify(key)}: ${error instanceof Error ? error.message : String(error)}`, { path: entry.path, exportKey: key }); }
      return { nodes, edges };
    }
    const parent = loaded.find(c => c.entry.path === entry.parentPath);
    return { id: partition.id, name: partition.name, path: entry.path,
      parent: entry.parentPath === null ? null : { path: entry.parentPath, ...(parent ? { id: parent.partition.id, name: parent.partition.name } : {}) },
      exports: {
        elements: Object.keys(partition.elements).sort(ordinal).map(key => ({ key, ...counts(partition.elements[key]!, key) })),
        diagrams: Object.keys(partition.diagrams).sort(ordinal).map(key => ({ key, ...counts(partition.diagrams[key]!.data, key), fileExtension: partition.diagrams[key]!.fileExtension })),
        metamodel: Object.keys(partition.metamodel).sort(ordinal),
      },
    };
  }) };
}
