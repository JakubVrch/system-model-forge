import { TRACE_ELEMENT_COMMAND, type Invocation } from '@cli/arguments/options';
import { formatTrace } from '@cli/commands/trace-element/format';
import { isTraceResponse } from '@cli/commands/trace-element/response';
import { formatSuccess } from '@cli/output/result';
import { runReadCommand } from '@cli/source/run-read-command';

export async function runTraceElement(invocation: Invocation): Promise<string> {
  const { data } = await runReadCommand(invocation, TRACE_ELEMENT_COMMAND, isTraceResponse);
  return formatSuccess(invocation.format, { command: TRACE_ELEMENT_COMMAND, data }, () => formatTrace(data));
}
