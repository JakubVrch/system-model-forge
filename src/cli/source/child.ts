import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Command, Invocation } from '@cli/arguments/options';
import { selectCandidates, validatePartition } from '@cli/source/select';
import { CHILD_ERROR_KIND, type ChildRequest, type ChildResponse, type ChildResult } from '@cli/source/result';
import { CliError, failure } from '@cli/errors';
import type { Entry, LoadedCandidate } from '@cli/source/model';

async function loadCandidates(entries: Entry[]): Promise<LoadedCandidate[]> {
  const loaded: LoadedCandidate[] = [];
  for (const entry of entries) {
    let partition: unknown;
    try {
      const source = await import(pathToFileURL(entry.absolutePath).href);
      partition = source.partition;
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new CliError(`${entry.path}: ${detail}`, { path: entry.path });
    }
    validatePartition(partition, entry.path);
    loaded.push({ entry, partition });
  }
  return loaded;
}

function isInvocationFor<Kind extends Command>(
  invocation: Invocation, command: Kind,
): invocation is Invocation & { command: Kind } {
  return invocation.command === command;
}

export function runSourceCommand<Kind extends Command>(
  entrypoint: string,
  command: Kind,
  run: (
    invocation: Invocation & { command: Kind },
    selected: LoadedCandidate[],
    loaded: LoadedCandidate[],
  ) => Extract<ChildResult, { kind: Kind }>,
): void {
  if (!process.send || !process.argv[1] || pathToFileURL(resolve(process.argv[1])).href !== entrypoint) return;

  process.once('message', async (request: ChildRequest) => {
    let response: ChildResponse;
    try {
      const { invocation, entries } = request;
      if (!isInvocationFor(invocation, command)) {
        throw new CliError('Source child received a request for the wrong command');
      }
      const loaded = await loadCandidates(entries);
      const selected = selectCandidates(loaded, invocation.ids, invocation.names);
      response = run(invocation, selected, loaded);
    } catch (error) {
      response = { kind: CHILD_ERROR_KIND, error: failure(error) };
    }
    process.send?.(response);
  });
}
