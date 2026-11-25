import { LIST_ELEMENTS_COMMAND, type Invocation } from '@cli/arguments/options';
import { formatElements } from '@cli/commands/list-elements/format';
import { isListElementsResponse } from '@cli/commands/list-elements/response';
import { formatSuccess } from '@cli/output/result';
import { runReadCommand } from '@cli/source/run-read-command';

export async function runListElements(invocation: Invocation): Promise<string> {
  const { data } = await runReadCommand(invocation, LIST_ELEMENTS_COMMAND, isListElementsResponse);
  return formatSuccess(invocation.format, { command: LIST_ELEMENTS_COMMAND, data }, () => formatElements(data));
}
