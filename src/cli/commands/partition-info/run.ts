import { PARTITION_INFO_COMMAND, type Invocation } from '@cli/arguments/options';
import { CliError, type InventoryResult } from '@cli/result';
import { discover } from '@cli/source/discover';
import { loadSources } from '@cli/source/source-process';

export async function runPartitionInfo(invocation: Invocation): Promise<InventoryResult> {
  const { root, paths } = invocation;
  const { entries } = await discover(root, paths);
  const response = await loadSources({ invocation, entries });
  if (response.kind !== PARTITION_INFO_COMMAND) throw new CliError('Source child returned a result for the wrong command');
  return response.data;
}
