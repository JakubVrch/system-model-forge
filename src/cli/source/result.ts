import type { Invocation } from '@cli/arguments/options';
import type { BuildSourceResult } from '@cli/commands/build/result';
import type { ListElementsSourceResult } from '@cli/commands/list-elements/result';
import type { PartitionInfoSourceResult } from '@cli/commands/partition-info/result';
import type { TraceElementSourceResult } from '@cli/commands/trace-element/result';
import type { Failure } from '@cli/errors';
import type { Entry } from '@cli/source/model';

export const CHILD_ERROR_KIND = 'error';

export type ChildRequest = {
  invocation: Invocation;
  entries: Entry[];
};

export type ChildResult =
  | BuildSourceResult
  | ListElementsSourceResult
  | PartitionInfoSourceResult
  | TraceElementSourceResult;

export type ChildResponse = ChildResult | { kind: typeof CHILD_ERROR_KIND; error: Failure };
