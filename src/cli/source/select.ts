import type { Partition } from '@core';
import { CliError } from '@cli/errors';
import { DIAGRAM_EXPORT_GROUP, ELEMENT_EXPORT_GROUP, type LoadedCandidate, type ParentIdentity, type SelectedExport } from '@cli/source/model';
import { ordinal } from '@cli/ordering';

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function set(value: unknown): boolean {
  return record(value) && typeof value.size === 'number' && typeof value.has === 'function' && typeof (value as unknown as Iterable<unknown>)[Symbol.iterator] === 'function';
}
export function validatePartition(value: unknown, sourcePath: string): asserts value is Partition {
  const invalid = (message: string, key?: string): never => {
    if (key === undefined) throw new CliError(`${sourcePath}: ${message}`, { path: sourcePath });
    throw new CliError(`${sourcePath}: export ${JSON.stringify(key)}: ${message}`, {
      path: sourcePath, exportKey: key,
    });
  };
  if (!record(value) || typeof value.id !== 'string' || typeof value.name !== 'string') {
    invalid('named partition export requires string id and name');
  }
  const partition = value as Record<string, unknown>;
  for (const group of [ELEMENT_EXPORT_GROUP, DIAGRAM_EXPORT_GROUP, 'metamodel']) {
    if (!record(partition[group])) invalid(`partition requires ${group} mapping`);
  }
  for (const [key, members] of Object.entries(partition.elements as Record<string, unknown>)) {
    if (!set(members)) invalid('element export requires a readonly set', key);
  }
  for (const [key, diagram] of Object.entries(partition.diagrams as Record<string, unknown>)) {
    if (!record(diagram) || !set(diagram.data) || typeof diagram.inNotation !== 'string' || typeof diagram.fileExtension !== 'string') {
      invalid('diagram requires data, inNotation and fileExtension', key);
    }
  }
  for (const [key, definition] of Object.entries(partition.metamodel as Record<string, unknown>)) {
    if (typeof definition !== 'function' || typeof (definition as unknown as { is?: unknown }).is !== 'function') {
      invalid('metamodel export requires a callable definition with is', key);
    }
  }
}
export function selectCandidates(candidates: LoadedCandidate[], ids: string[], names: string[]): LoadedCandidate[] {
  const seen = new Set<string>();
  for (const candidate of candidates) {
    if (seen.has(candidate.partition.id)) {
      throw new CliError(`Duplicate candidate partition ID: ${candidate.partition.id}`, {
        path: candidate.entry.path, partitionId: candidate.partition.id,
      });
    }
    seen.add(candidate.partition.id);
  }
  for (const [values, field] of [[ids, 'id'], [names, 'name']] as const) {
    for (const value of values) {
      if (!candidates.some(candidate => candidate.partition[field] === value)) {
        throw new CliError(`Partition ${field} selector matched no candidates: ${value}`, { selector: value });
      }
    }
  }
  const selected = candidates.filter(({ partition }) =>
    (!ids.length || ids.includes(partition.id)) && (!names.length || names.includes(partition.name)));
  if (!selected.length && (ids.length || names.length)) throw new CliError('Partition selector intersection is empty');
  return selected.sort((a, b) => ordinal(a.entry.path, b.entry.path));
}
export function parentIdentity(candidate: LoadedCandidate, candidates: LoadedCandidate[]): ParentIdentity | null {
  const path = candidate.entry.parentPath;
  if (path === null) return null;
  const parent = candidates.find(value => value.entry.path === path);
  return parent ? { path, id: parent.partition.id, name: parent.partition.name } : { path };
}

export function selectExports(candidates: LoadedCandidate[], elements: string[], diagrams: string[]): SelectedExport[] {
  const groups = [[ELEMENT_EXPORT_GROUP, elements], [DIAGRAM_EXPORT_GROUP, diagrams]] as const;
  for (const [group, keys] of groups) {
    const available = new Set(candidates.flatMap(candidate => Object.keys(candidate.partition[group])));
    for (const key of keys) {
      if (!available.has(key)) {
        const choices = [...available].sort(ordinal).join(', ') || '(none)';
        throw new CliError(`Unknown ${group} export ${JSON.stringify(key)}; available: ${choices}`, {
          exportGroup: group, exportKey: key,
        });
      }
    }
  }

  const all = !elements.length && !diagrams.length;
  const selections: SelectedExport[] = [];
  const ordered = [...candidates].sort((left, right) => ordinal(left.entry.path, right.entry.path));
  for (const { partition, entry } of ordered) {
    const provenance = { id: partition.id, name: partition.name, path: entry.path };
    for (const [group, keys] of groups) {
      for (const key of Object.keys(partition[group]).sort(ordinal)) {
        if (all || keys.includes(key)) {
          selections.push({
            partition: { ...provenance },
            export: { group, key },
            members: group === ELEMENT_EXPORT_GROUP ? partition.elements[key]! : partition.diagrams[key]!.data,
          });
        }
      }
    }
  }
  return selections;
}
