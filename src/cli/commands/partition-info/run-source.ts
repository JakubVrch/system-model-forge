import { PARTITION_INFO_COMMAND } from '@cli/arguments/options';
import { partitionInfo } from '@cli/commands/partition-info/inventory';
import type { PartitionInfoSourceResult } from '@cli/commands/partition-info/result';
import type { LoadedCandidate } from '@cli/source/model';
import { runSourceCommand } from '@cli/source/child';

function runPartitionInfoSource(
  selected: LoadedCandidate[], loaded: LoadedCandidate[],
): PartitionInfoSourceResult {
  return { kind: PARTITION_INFO_COMMAND, data: partitionInfo(selected, loaded) };
}

runSourceCommand(import.meta.url, PARTITION_INFO_COMMAND, (_invocation, selected, loaded) => runPartitionInfoSource(selected, loaded));
