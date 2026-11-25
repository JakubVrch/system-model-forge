import { BUILD_COMMAND } from '@cli/arguments/options';
import type { BuildSourceResult } from '@cli/commands/build/result';
import { hasStrings, isPartitionIdentity, isRecord } from '@cli/source/ipc';

function isPlannedPartition(value: unknown): boolean {
  return isPartitionIdentity(value) && Array.isArray(value.artifacts) && value.artifacts.every(artifact =>
    isRecord(artifact) && hasStrings(artifact, ['partitionPath', 'diagramKey', 'path', 'text'])
    && artifact.partitionPath === value.path);
}

export function isBuildResponse(value: unknown): value is BuildSourceResult {
  return isRecord(value) && value.kind === BUILD_COMMAND
    && isRecord(value.plan) && Array.isArray(value.plan.partitions) && value.plan.partitions.every(isPlannedPartition);
}
