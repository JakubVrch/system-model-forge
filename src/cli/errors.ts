import type { BuildSummary } from '@cli/commands/build/result';

export type ErrorContext = Partial<Record<
  'path' | 'partitionId' | 'exportGroup' | 'exportKey' | 'selector' | 'destination', string
>>;

export type Failure = {
  message: string;
  context: ErrorContext;
};

export class CliError extends Error {
  constructor(
    message: string,
    public readonly context: ErrorContext = {},
    public readonly partial: BuildSummary | null = null,
  ) {
    super(message);
  }
}

export function failure(error: unknown): Failure {
  return {
    message: error instanceof Error ? error.message : String(error),
    context: error instanceof CliError ? error.context : {},
  };
}
