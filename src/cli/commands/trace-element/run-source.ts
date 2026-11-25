import { TRACE_ELEMENT_COMMAND, type Invocation } from '@cli/arguments/options';
import { traceElements } from '@cli/commands/trace-element/trace';
import type { TraceElementSourceResult } from '@cli/commands/trace-element/result';
import type { LoadedCandidate } from '@cli/source/model';
import { selectExports } from '@cli/source/select';
import { runSourceCommand } from '@cli/source/child';

function runTraceElementSource(
  { elementId, depth }: Extract<Invocation, { command: typeof TRACE_ELEMENT_COMMAND }>,
  selected: LoadedCandidate[],
): TraceElementSourceResult {
  const exports = selectExports(selected, [], []);
  return { kind: TRACE_ELEMENT_COMMAND, data: traceElements(exports, elementId, depth) };
}

runSourceCommand(import.meta.url, TRACE_ELEMENT_COMMAND, runTraceElementSource);
