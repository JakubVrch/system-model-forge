import type { GraphElement } from '@core';
import { kindOf } from '@cli/source/graph-element';
import { parentIdentity } from '@cli/source/select';
import { CliError } from '@cli/errors';
import { ordinal } from '@cli/ordering';
import type { ExportCounts, InventoryResult } from '@cli/commands/partition-info/result';
import type { LoadedCandidate } from '@cli/source/model';

function countExport(members: ReadonlySet<GraphElement>, path: string, key: string): ExportCounts {
  const counts = { node: 0, edge: 0 };
  try {
    for (const member of members) counts[kindOf(member)]++;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new CliError(`${path}: export ${JSON.stringify(key)}: ${detail}`, { path, exportKey: key });
  }
  return { key, nodes: counts.node, edges: counts.edge };
}

export function partitionInfo(selected: LoadedCandidate[], loaded: LoadedCandidate[]): InventoryResult {
  const ordered = [...selected].sort((left, right) => ordinal(left.entry.path, right.entry.path));
  return {
    partitions: ordered.map(candidate => {
      const { partition, entry: { path } } = candidate;
      return {
        id: partition.id,
        name: partition.name,
        path,
        parent: parentIdentity(candidate, loaded),
        exports: {
          elements: Object.keys(partition.elements).sort(ordinal).map(key =>
            countExport(partition.elements[key]!, path, key)),
          diagrams: Object.keys(partition.diagrams).sort(ordinal).map(key => {
            const diagram = partition.diagrams[key]!;
            return { ...countExport(diagram.data, path, key), fileExtension: diagram.fileExtension };
          }),
          metamodel: Object.keys(partition.metamodel).sort(ordinal),
        },
      };
    }),
  };
}
