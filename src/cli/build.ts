import { lstat, mkdir, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { canonical, contained } from './discover.ts';
import { CliError, ordinal, type BuildPlan, type BuildSummary, type ErrorContext } from './result.ts';

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
      if (['ENOENT', 'ENOTDIR'].includes((error as NodeJS.ErrnoException).code ?? '')) break;
      throw error;
    }
  }
}
async function fileIdentity(target: string): Promise<string | undefined> {
  try { const info = await stat(target, { bigint: true }); return info.isFile() ? `${info.dev}:${info.ino}` : undefined; }
  catch (error) { if (['ENOENT', 'ENOTDIR'].includes((error as NodeJS.ErrnoException).code ?? '')) return undefined; throw error; }
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
        try { const second = await stat(path.join(path.dirname(current), alternate), { bigint: true }); return first.dev === second.dev && first.ino === second.ino; }
        catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false; throw error; }
      } catch (error) { if (!['ENOENT', 'ENOTDIR'].includes((error as NodeJS.ErrnoException).code ?? '')) throw error; }
    }
    const parent = path.dirname(current);
    if (parent === current) return false;
    current = parent;
  }
}
export async function executeBuild(plan: BuildPlan, root: string, out: string, dryRun: boolean): Promise<BuildSummary> {
  const sourceRoot = await realpath(root);
  const output = path.resolve(out);
  await rejectSymlinks(output);
  const canonicalOutput = await canonical(output);
  if (canonicalOutput === sourceRoot) throw new CliError('Build destination must differ from source root', { destination: out });
  const partitions = [...plan.partitions].sort((a, b) => ordinal(a.path, b.path)).map(p => ({ ...p, artifacts: [...p.artifacts].sort((a, b) => ordinal(a.diagramKey, b.diagramKey)) }));
  const planned = new Set<string>();
  const caseInsensitive = await foldsCase(output);
  const sourceIdentities = new Set<string>();
  for (const partition of partitions) {
    const identity = await fileIdentity(path.resolve(root, partition.path));
    if (identity) sourceIdentities.add(identity);
  }
  // Complete validation before mkdir or writeFile. Never trust IPC paths alone.
  for (const partition of partitions) for (const artifact of partition.artifacts) {
    const destination = path.resolve(output, artifact.path);
    const context: ErrorContext = { path: partition.path, partitionId: partition.id, exportGroup: 'diagrams', exportKey: artifact.diagramKey, destination: artifact.path };
    try {
      if (!artifact.path || path.posix.isAbsolute(artifact.path) || /[\\:\x00-\x1f]/.test(artifact.path) || artifact.path.split('/').some(p => p === '..' || p === '.' || p === '') || !contained(output, destination) || destination === output) throw new CliError('Artifact path must be relative and cannot escape destination');
      await rejectSymlinks(destination);
      const identity = await fileIdentity(destination);
      if ((contained(sourceRoot, destination) && artifact.path.endsWith('.partition.ts')) || (identity && sourceIdentities.has(identity))) throw new CliError('Artifact would overwrite a source entry');
      planned.add(identity ?? (caseInsensitive ? destination.toLowerCase() : destination));
    } catch (error) {
      throw new CliError(`${partition.path}: diagram ${JSON.stringify(artifact.diagramKey)}: ${error instanceof Error ? error.message : String(error)}`, context);
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
  process.once('SIGINT', interrupt); process.once('SIGTERM', interrupt);
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
          throw new CliError(`${partition.path}: diagram ${JSON.stringify(artifact.diagramKey)} -> ${artifact.path}: ${error instanceof Error ? error.message : String(error)}`, { path: partition.path, partitionId: partition.id, exportGroup: 'diagrams', exportKey: artifact.diagramKey, destination: artifact.path }, summary);
        }
      }
    }
    return summary;
  } finally {
    process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt);
  }
}
