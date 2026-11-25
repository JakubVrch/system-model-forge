import type { BUILD_COMMAND, Invocation } from '@cli/arguments/options';
import type { ChildResult } from '@cli/source/result';
import { discover } from '@cli/source/discover';
import type { ResponseValidator } from '@cli/source/ipc';
import { loadSources } from '@cli/source/source-process';

type ReadResult = Exclude<ChildResult, { kind: typeof BUILD_COMMAND }>;

export async function runReadCommand<Result extends ReadResult>(
  invocation: Invocation, command: Result['kind'], validate: ResponseValidator<Result>,
): Promise<Result> {
  const { entries } = await discover(invocation.root, invocation.paths);
  const childUrl = new URL(`../commands/${command}/run-source.js`, import.meta.url);
  return loadSources({ invocation, entries }, childUrl, validate);
}
