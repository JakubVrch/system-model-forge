import type { TRACE_ELEMENT_COMMAND } from '@cli/arguments/options';
import type { Identity } from '@cli/source/model';

type TraceIdentity = Identity & { modelType: string | null };

export type TraceElement = TraceIdentity & { relationships: TraceBranch[] };

export type TraceBranch = TraceIdentity & { direction: 'To' | 'From'; element: TraceElement };

export type TraceResult = { roots: TraceElement[] };

export type TraceElementResult = { command: typeof TRACE_ELEMENT_COMMAND; data: TraceResult };

export type TraceElementSourceResult = { kind: typeof TRACE_ELEMENT_COMMAND; data: TraceResult };
