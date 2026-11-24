import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { BUILD_COMMAND, LIST_ELEMENTS_COMMAND, PARTITION_INFO_COMMAND } from '@cli/arguments/options';
import { buildPlan } from '@cli/commands/build/plan';
import { inspectElements } from '@cli/commands/list-elements/inspect';
import { partitionInfo } from '@cli/commands/partition-info/inventory';
import { selectCandidates, selectExports, validatePartition } from '@cli/source/select';
import {
  CHILD_ERROR_KIND, CliError, failure,
  type ChildRequest, type ChildResponse, type ChildResult, type Entry, type LoadedCandidate,
} from '@cli/result';

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

async function runSourceCommand(request: ChildRequest): Promise<ChildResult> {
  const { command, ids, names, elements, diagrams, properties, limit } = request.invocation;
  const loaded = await loadCandidates(request.entries);
  const selected = selectCandidates(loaded, ids, names);
  switch (command) {
    case LIST_ELEMENTS_COMMAND:
      return { kind: command, data: inspectElements(selectExports(selected, elements, diagrams), properties, limit) };
    case PARTITION_INFO_COMMAND:
      return { kind: command, data: partitionInfo(selected, loaded) };
    case BUILD_COMMAND:
      return { kind: command, plan: buildPlan(selected) };
    default:
      throw new CliError(`Command not implemented: ${command}`);
  }
}

if (process.send && process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  process.once('message', async (request: ChildRequest) => {
    let response: ChildResponse;
    try {
      response = await runSourceCommand(request);
    } catch (error) {
      response = { kind: CHILD_ERROR_KIND, error: failure(error) };
    }
    process.send?.(response);
  });
}
