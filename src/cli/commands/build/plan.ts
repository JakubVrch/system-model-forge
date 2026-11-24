import { posix } from 'node:path';
import {
  CliError, DIAGRAM_EXPORT_GROUP, ordinal, type BuildPlan, type LoadedCandidate, type PlannedPartition,
} from '@cli/result';

/** Common filesystem limit for a single filename component, measured in UTF-8 bytes. */
const MAX_FILENAME_BYTES = 255;
// Exclude path separators, Windows-forbidden punctuation, and C0/C1 terminal controls.
const forbiddenFilenameCharacters = /[<>:"/\\|?*\x00-\x1f\x7f-\x9f]/;
const windowsDeviceName = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;

/** Validate portable filename components without changing authored text or keys. */
function diagramFilename(key: string, extension: string): string {
  const filename = key + extension;
  const validKey = key && key !== '.' && key !== '..' && !forbiddenFilenameCharacters.test(key);
  const validExtension = extension.startsWith('.') && extension.length > 1
    && !extension.includes('..') && !forbiddenFilenameCharacters.test(extension);
  if (!validKey || !validExtension || Buffer.byteLength(filename, 'utf8') > MAX_FILENAME_BYTES
      || /[. ]$/.test(filename) || windowsDeviceName.test(filename)) {
    throw new CliError(`Invalid diagram key or fileExtension: ${JSON.stringify(key)} / ${JSON.stringify(extension)}`);
  }
  return filename;
}

function planPartition({ entry, partition }: LoadedCandidate): PlannedPartition {
  const artifacts = Object.keys(partition.diagrams).sort(ordinal).map(key => {
    const diagram = partition.diagrams[key]!;
    try {
      const filename = diagramFilename(key, diagram.fileExtension);
      return {
        partitionPath: entry.path,
        diagramKey: key,
        path: posix.join(posix.dirname(entry.path), filename),
        text: diagram.inNotation,
      };
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new CliError(`${entry.path}: diagram ${JSON.stringify(key)}: ${detail}`, {
        path: entry.path, partitionId: partition.id, exportGroup: DIAGRAM_EXPORT_GROUP, exportKey: key,
      });
    }
  });
  return { id: partition.id, name: partition.name, path: entry.path, artifacts };
}

export function buildPlan(candidates: LoadedCandidate[]): BuildPlan {
  const ordered = [...candidates].sort((left, right) => ordinal(left.entry.path, right.entry.path));
  return { partitions: ordered.map(planPartition) };
}
