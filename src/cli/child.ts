import { inspectElements, partitionInfo } from './inspect.ts';
import { posix, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { selectCandidates, selectExports, validatePartition } from './select.ts';
import { CliError, failure, ordinal, type BuildPlan, type ChildRequest, type ChildResponse, type LoadedCandidate } from './result.ts';

export async function loadCandidates(request: ChildRequest, loaded: LoadedCandidate[] = []): Promise<LoadedCandidate[]> {
  const candidates = loaded;
  for (const entry of request.entries) {
    try {
      const source = await import(pathToFileURL(entry.absolutePath).href);
      validatePartition(source.partition, entry.path);
      candidates.push({ entry, partition: source.partition });
    } catch (error) {
      throw new CliError(`${entry.path}: ${error instanceof Error ? error.message : String(error)}`, { path: entry.path });
    }
  }
  return selectCandidates(candidates, request.invocation.ids, request.invocation.names);
}

/** Validate portable filename components without changing authored text or keys. */
export function diagramFilename(key: string, extension: string): string {
  const invalid = /[<>:"/\\|?*\x00-\x1f\x7f-\x9f]/;
  const filename = key + extension;
  if (Buffer.byteLength(filename, 'utf8') > 255 || !key || key === '.' || key === '..' || invalid.test(key) ||
      !extension.startsWith('.') || extension.length < 2 || extension.includes('..') || invalid.test(extension) ||
      /[. ]$/.test(filename) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(filename)) {
    throw new CliError(`Invalid diagram key or fileExtension: ${JSON.stringify(key)} / ${JSON.stringify(extension)}`);
  }
  return filename;
}
export function buildPlan(candidates: LoadedCandidate[]): BuildPlan {
  return { partitions: [...candidates].sort((a, b) => ordinal(a.entry.path, b.entry.path)).map(({ entry, partition }) => ({
    id: partition.id, name: partition.name, path: entry.path,
    artifacts: Object.keys(partition.diagrams).sort(ordinal).map(key => {
      const diagram = partition.diagrams[key]!;
      try {
        const filename = diagramFilename(key, diagram.fileExtension);
        return { partitionPath: entry.path, diagramKey: key, path: posix.join(posix.dirname(entry.path), filename), text: diagram.inNotation };
      } catch (error) {
        throw new CliError(`${entry.path}: diagram ${JSON.stringify(key)}: ${error instanceof Error ? error.message : String(error)}`, { path: entry.path, partitionId: partition.id, exportGroup: 'diagrams', exportKey: key });
      }
    }),
  })) };
}

if (process.send && process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) process.once('message', async (request: ChildRequest) => {
  let response: ChildResponse;
  try {
    const loaded: LoadedCandidate[] = [];
    const candidates = await loadCandidates(request, loaded);
    if (request.invocation.command === 'list-elements') response = { kind: 'list-elements', data: inspectElements(selectExports(candidates, request.invocation.elements, request.invocation.diagrams), request.invocation.properties, request.invocation.limit) };
    else if (request.invocation.command === 'partition-info') response = { kind: 'partition-info', data: partitionInfo(candidates, loaded) };
    else if (request.invocation.command === 'build') response = { kind: 'build', plan: buildPlan(candidates) };
    else throw new CliError(`Command not implemented: ${request.invocation.command}`);
  } catch (error) { response = { kind: 'error', error: failure(error) }; }
  process.send?.(response);
});
