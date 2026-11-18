import { readdir, realpath } from 'node:fs/promises';
import path from 'node:path';
import { CliError, ordinal, type Entry } from './result.ts';

export function validatePattern(pattern: string): void {
  if (!pattern || path.posix.isAbsolute(pattern) || /[\\\[\]{}():\x00-\x1f]/.test(pattern) ||
      pattern.split('/').some(segment => !segment || segment === '..' || segment === '.' || (segment.includes('**') && segment !== '**'))) {
    throw new CliError(`Invalid path pattern: ${pattern}; use segment * / ? and whole-segment **`, { selector: pattern });
  }
}
export function contained(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}
/** Resolve existing ancestors too, so a not-yet-created output under an alias is pruned. */
export async function canonical(target: string): Promise<string> {
  try { return await realpath(target); } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    const parent = path.dirname(target);
    if (parent === target) throw error;
    return path.join(await canonical(parent), path.basename(target));
  }
}
export async function discover(root: string, patterns: string[] = [], out?: string): Promise<Entry[]> {
  patterns.forEach(validatePattern);
  const absoluteRoot = await realpath(root);
  const output = out ? await canonical(out) : undefined;
  const entries: Entry[] = [];
  async function walk(directory: string): Promise<void> {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      if (item.isSymbolicLink()) continue;
      const absolutePath = path.join(directory, item.name);
      if (output && contained(absoluteRoot, output) && contained(output, absolutePath)) continue;
      if (item.isDirectory()) {
        if (!item.name.startsWith('_') && !item.name.startsWith('.') && item.name !== 'node_modules') await walk(absolutePath);
      } else if (item.isFile() && item.name.endsWith('.partition.ts')) {
        entries.push({ absolutePath, path: path.relative(absoluteRoot, absolutePath).split(path.sep).join('/'), parentPath: null });
      }
    }
  }
  await walk(absoluteRoot);
  entries.sort((a, b) => ordinal(a.path, b.path));
  const folders = new Map<string, Entry[]>();
  for (const entry of entries) { const dir = path.posix.dirname(entry.path); folders.set(dir, [...folders.get(dir) ?? [], entry]); }
  for (const entry of entries) {
    let dir = path.posix.dirname(entry.path);
    while (dir !== '.') {
      dir = path.posix.dirname(dir);
      const parent = folders.get(dir)?.[0];
      if (parent) { entry.parentPath = parent.path; break; }
    }
  }
  for (const pattern of patterns) if (!entries.some(entry => path.posix.matchesGlob(entry.path, pattern))) throw new CliError(`Path selector matched no entries: ${pattern}`, { selector: pattern });
  const candidates = patterns.length ? entries.filter(entry => patterns.some(pattern => path.posix.matchesGlob(entry.path, pattern))) : entries;
  const selectedFolders = new Set<string>();
  for (const entry of candidates) {
    const dir = path.posix.dirname(entry.path);
    if (selectedFolders.has(dir)) throw new CliError(`Ambiguous partition entries in folder: ${dir}`, { path: entry.path });
    selectedFolders.add(dir);
  }
  return candidates;
}
