import { lstat, mkdir, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { canonical, contained, fileIdentity, isMissingPath, PARTITION_ENTRY_SUFFIX } from '@cli/filesystem/paths';
import {
  CliError, DIAGRAM_EXPORT_GROUP, ordinal, type BuildArtifact, type BuildPlan,
  type BuildSummary, type ErrorContext, type PartitionIdentity,
} from '@cli/result';

/** Existing regular-file obstructions are write errors; symlinks are preflight errors. */
async function rejectSymlinks(target: string): Promise<void> {
  const parsed = path.parse(target);
  let current = parsed.root;
  for (const component of target.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, component);
    try {
      const info = await lstat(current);
      if (info.isSymbolicLink()) throw new CliError(`Destination contains a symlink: ${current}`, { destination: target });
      if (!info.isDirectory() && current !== target) break;
    } catch (error) {
      if (isMissingPath(error)) break;
      throw error;
    }
  }
}
function artifactContext(partition: PartitionIdentity, artifact: BuildArtifact): ErrorContext {
  return {
    path: partition.path,
    partitionId: partition.id,
    exportGroup: DIAGRAM_EXPORT_GROUP,
    exportKey: artifact.diagramKey,
    destination: artifact.path,
  };
}

function preflightPath(output: string, relative: string): string {
  const destination = path.resolve(output, relative);
  // IPC paths are POSIX-relative. Reject Windows path syntax and C0 controls here too.
  if (!relative || path.posix.isAbsolute(relative) || /[\\:\x00-\x1f]/.test(relative)
      || relative.split('/').some(component => component === '..' || component === '.' || component === '')
      || !contained(output, destination) || destination === output) {
    throw new CliError('Artifact path must be relative and cannot escape destination');
  }
  return destination;
}

/** Read-only probe of the existing output ancestry for filesystem name folding. */
async function foldsCase(target: string): Promise<boolean> {
  let current = target;
  while (true) {
    const name = path.basename(current);
    const alternate = name.replace(/[a-zA-Z]/, c => c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase());
    if (alternate !== name) {
      try {
        const first = await stat(current, { bigint: true });
        try {
          const second = await stat(path.join(path.dirname(current), alternate), { bigint: true });
          return first.dev === second.dev && first.ino === second.ino;
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
          throw error;
        }
      } catch (error) {
        if (!isMissingPath(error)) throw error;
      }
    }
    const parent = path.dirname(current);
    if (parent === current) return false;
    current = parent;
  }
}
export async function executeBuild(
  plan: BuildPlan, root: string, out: string, dryRun: boolean, sourceIdentities: ReadonlySet<string>,
): Promise<BuildSummary> {
  const sourceRoot = await realpath(root);
  const output = path.resolve(out);
  await rejectSymlinks(output);
  const canonicalOutput = await canonical(output);
  if (canonicalOutput === sourceRoot) throw new CliError('Build destination must differ from source root', { destination: out });
  const partitions = [...plan.partitions].sort((left, right) => ordinal(left.path, right.path)).map(partition => ({
    ...partition,
    artifacts: [...partition.artifacts].sort((left, right) => ordinal(left.diagramKey, right.diagramKey)),
  }));
  const planned = new Set<string>();
  const caseInsensitive = await foldsCase(output);
  // Complete validation before mkdir or writeFile. Never trust IPC paths alone.
  for (const partition of partitions) {
    for (const artifact of partition.artifacts) {
      try {
        const destination = preflightPath(output, artifact.path);
        await rejectSymlinks(destination);
        const identity = await fileIdentity(destination);
        if ((contained(sourceRoot, destination) && artifact.path.endsWith(PARTITION_ENTRY_SUFFIX))
            || (identity && sourceIdentities.has(identity))) {
          throw new CliError('Artifact would overwrite a source entry');
        }
        planned.add(identity ?? (caseInsensitive ? destination.toLowerCase() : destination));
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        throw new CliError(
          `${partition.path}: diagram ${JSON.stringify(artifact.diagramKey)}: ${detail}`,
          artifactContext(partition, artifact),
        );
      }
    }
  }
  const summary: BuildSummary = { dryRun, partitions: [], exportedFiles: 0 };
  if (dryRun) {
    summary.partitions = partitions.map(p => ({ id: p.id, name: p.name, path: p.path, diagrams: p.artifacts.map(a => a.diagramKey) }));
    summary.plannedFiles = planned.size;
    summary.artifacts = partitions.flatMap(p => p.artifacts.map(({ text: _text, ...artifact }) => artifact));
    return summary;
  }
  const successful = new Set<string>();
  let interrupted = false;
  const interrupt = () => { interrupted = true; };
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);
  try {
    for (const partition of partitions) {
      const processed = { id: partition.id, name: partition.name, path: partition.path, diagrams: [] as string[] };
      summary.partitions.push(processed);
      for (const artifact of partition.artifacts) {
        const destination = path.resolve(output, artifact.path);
        try {
          if (interrupted) throw new Error('Build interrupted');
          // Recheck immediately before mutation as well as in the complete preflight.
          await rejectSymlinks(destination);
          await mkdir(path.dirname(destination), { recursive: true });
          await writeFile(destination, artifact.text, 'utf8');
          successful.add(await fileIdentity(destination) ?? destination);
          processed.diagrams.push(artifact.diagramKey);
          summary.exportedFiles = successful.size;
          if (interrupted) throw new Error('Build interrupted');
        } catch (error) {
          const detail = error instanceof Error ? error.message : String(error);
          throw new CliError(
            `${partition.path}: diagram ${JSON.stringify(artifact.diagramKey)} -> ${artifact.path}: ${detail}`,
            artifactContext(partition, artifact),
            summary,
          );
        }
      }
    }
    return summary;
  } finally {
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', interrupt);
  }
}
