import { TRACE_ELEMENT_COMMAND } from '@cli/arguments/options';
import type { TraceElementSourceResult } from '@cli/commands/trace-element/result';
import { hasStrings, isModelType, isRecord } from '@cli/source/ipc';

function isTraceIdentity(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && hasStrings(value, ['id', 'name']) && isModelType(value.modelType);
}

function isTraceElement(value: unknown): boolean {
  return isTraceIdentity(value) && Array.isArray(value.relationships) && value.relationships.every(branch =>
    isTraceIdentity(branch) && (branch.direction === 'To' || branch.direction === 'From') && isTraceElement(branch.element));
}

export function isTraceResponse(value: unknown): value is TraceElementSourceResult {
  return isRecord(value) && value.kind === TRACE_ELEMENT_COMMAND
    && isRecord(value.data) && Array.isArray(value.data.roots)
    && value.data.roots.length > 0 && value.data.roots.every(isTraceElement);
}
