import { PARTITION_INFO_COMMAND, type Invocation } from '@cli/arguments/options';
import { formatInventory } from '@cli/commands/partition-info/format';
import { isPartitionInfoResponse } from '@cli/commands/partition-info/response';
import { formatSuccess } from '@cli/output/result';
import { runReadCommand } from '@cli/source/run-read-command';

export async function runPartitionInfo(invocation: Invocation): Promise<string> {
  const { data } = await runReadCommand(invocation, PARTITION_INFO_COMMAND, isPartitionInfoResponse);
  return formatSuccess(invocation.format, { command: PARTITION_INFO_COMMAND, data }, () => formatInventory(data));
}
