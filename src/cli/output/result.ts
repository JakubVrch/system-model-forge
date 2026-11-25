import { JSON_OUTPUT_FORMAT, type Action, type OutputFormat } from '@cli/arguments/options';
import type { BuildResult, BuildSummary } from '@cli/commands/build/result';
import type { ListElementsResult } from '@cli/commands/list-elements/result';
import type { PartitionInfoResult } from '@cli/commands/partition-info/result';
import type { TraceElementResult } from '@cli/commands/trace-element/result';
import type { HelpResult } from '@cli/commands/help/run';
import type { VersionResult } from '@cli/commands/version/run';
import type { Failure } from '@cli/errors';

/** Version of the JSON document emitted on stdout. */
export const OUTPUT_SCHEMA_VERSION = 1;

type CommandSuccess =
  | HelpResult
  | VersionResult
  | BuildResult
  | ListElementsResult
  | PartitionInfoResult
  | TraceElementResult;

type SuccessEnvelope = CommandSuccess & {
  schemaVersion: typeof OUTPUT_SCHEMA_VERSION;
  success: true;
  error: null;
};

type FailureEnvelope = {
  schemaVersion: typeof OUTPUT_SCHEMA_VERSION;
  command: Action | null;
  success: false;
  data: BuildSummary | null;
  error: Failure;
};

export type Envelope = SuccessEnvelope | FailureEnvelope;

export function jsonLine(envelope: Envelope): string {
  return `${JSON.stringify(envelope)}\n`;
}

export function formatSuccess(format: OutputFormat, result: CommandSuccess, pretty: () => string): string {
  return format === JSON_OUTPUT_FORMAT
    ? jsonLine({ schemaVersion: OUTPUT_SCHEMA_VERSION, ...result, success: true, error: null })
    : `${pretty()}\n`;
}
