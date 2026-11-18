import type { Partition } from '../core/index.ts';
import { CliError, ordinal, type LoadedCandidate, type ParentIdentity } from './result.ts';

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function set(value: unknown): boolean {
  return record(value) && typeof value.size === 'number' && typeof value.has === 'function' && typeof (value as unknown as Iterable<unknown>)[Symbol.iterator] === 'function';
}
export function validatePartition(value: unknown, sourcePath: string): asserts value is Partition {
  const invalid = (message: string, key?: string) => { throw new CliError(`${sourcePath}: ${message}`, { path: sourcePath, ...(key === undefined ? {} : { exportKey: key }) }); };
  if (!record(value) || typeof value.id !== 'string' || typeof value.name !== 'string') invalid('named partition export requires string id and name');
  const partition = value as Record<string, unknown>;
  for (const group of ['elements', 'diagrams', 'metamodel']) if (!record(partition[group])) invalid(`partition requires ${group} mapping`);
  for (const [key, members] of Object.entries(partition.elements as Record<string, unknown>)) if (!set(members)) invalid('element export requires a readonly set', key);
  for (const [key, diagram] of Object.entries(partition.diagrams as Record<string, unknown>)) {
    if (!record(diagram) || !set(diagram.data) || typeof diagram.inNotation !== 'string' || typeof diagram.fileExtension !== 'string') invalid('diagram requires data, inNotation and fileExtension', key);
  }
  for (const [key, definition] of Object.entries(partition.metamodel as Record<string, unknown>)) {
    if (typeof definition !== 'function' || typeof (definition as unknown as { is?: unknown }).is !== 'function') invalid('metamodel export requires a callable definition with is', key);
  }
}
export function selectCandidates(candidates: LoadedCandidate[], ids: string[], names: string[]): LoadedCandidate[] {
  const seen = new Set<string>();
  for (const candidate of candidates) {
    validatePartition(candidate.partition, candidate.entry.path);
    if (seen.has(candidate.partition.id)) throw new CliError(`Duplicate candidate partition ID: ${candidate.partition.id}`, { path: candidate.entry.path, partitionId: candidate.partition.id });
    seen.add(candidate.partition.id);
  }
  for (const [values, field] of [[ids, 'id'], [names, 'name']] as const) for (const value of values) {
    if (!candidates.some(candidate => candidate.partition[field] === value)) throw new CliError(`Partition ${field} selector matched no candidates: ${value}`, { selector: value });
  }
  const selected = candidates.filter(({ partition }) => (!ids.length || ids.includes(partition.id)) && (!names.length || names.includes(partition.name)));
  if (!selected.length && (ids.length || names.length)) throw new CliError('Partition selector intersection is empty');
  return selected.sort((a, b) => ordinal(a.entry.path, b.entry.path));
}
export function parentIdentity(candidate: LoadedCandidate, candidates: LoadedCandidate[]): ParentIdentity | null {
  const path = candidate.entry.parentPath;
  if (path === null) return null;
  const parent = candidates.find(value => value.entry.path === path);
  return parent ? { path, id: parent.partition.id, name: parent.partition.name } : { path };
}

export function selectExports(candidates: LoadedCandidate[], elements: string[], diagrams: string[]): import('./result.ts').SelectedExport[] {
  for (const [group, keys] of [['elements', elements], ['diagrams', diagrams]] as const) {
    const available = [...new Set(candidates.flatMap(c => Object.keys(c.partition[group])))].sort(ordinal);
    for (const key of keys) if (!available.includes(key)) throw new CliError(`Unknown ${group} export ${JSON.stringify(key)}; available: ${available.join(', ') || '(none)'}`, { exportGroup: group, exportKey: key });
  }
  const all = !elements.length && !diagrams.length;
  return [...candidates].sort((a, b) => ordinal(a.entry.path, b.entry.path)).flatMap(({ partition, entry }) =>
    (['elements', 'diagrams'] as const).flatMap(group => Object.keys(partition[group]).sort(ordinal)
      .filter(key => all || (group === 'elements' ? elements : diagrams).includes(key))
      .map(key => ({ partition: { id: partition.id, name: partition.name, path: entry.path }, export: { group, key }, members: group === 'elements' ? partition.elements[key]! : partition.diagrams[key]!.data }))));
}
