import { readdir, realpath } from 'node:fs/promises';
import path from 'node:path';
import { canonical, contained, fileIdentity, PARTITION_ENTRY_SUFFIX } from '@cli/filesystem/paths';
import { CliError } from '@cli/errors';
import { ordinal } from '@cli/ordering';
import type { Entry } from '@cli/source/model';

export function validatePattern(pattern: string): void {
  if (!pattern || path.posix.isAbsolute(pattern) || /[\\\[\]{}():\x00-\x1f]/.test(pattern) ||
      pattern.split('/').some(segment => !segment || segment === '..' || segment === '.' || (segment.includes('**') && segment !== '**'))) {
    throw new CliError(`Invalid path pattern: ${pattern}; use segment * / ? and whole-segment **`, { selector: pattern });
  }
}
type Discovery = {
  entries: Entry[];
  sourceIdentities: ReadonlySet<string>;
};

// Dependency trees may contain partition entries belonging to other packages.
const DEPENDENCY_DIRECTORY = 'node_modules';

function isModelDirectory(name: string): boolean {
  // Dot and underscore directories are hidden or support code.
  return !name.startsWith('.') && !name.startsWith('_') && name !== DEPENDENCY_DIRECTORY;
}

async function collectEntries(root: string, excludedOutput: string | undefined): Promise<Entry[]> {
  const entries: Entry[] = [];
  const pendingDirectories = [root];
  for (let directory = pendingDirectories.pop(); directory !== undefined; directory = pendingDirectories.pop()) {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      if (item.isSymbolicLink()) continue;
      const absolutePath = path.join(directory, item.name);
      if (excludedOutput && contained(excludedOutput, absolutePath)) continue;
      if (item.isDirectory() && isModelDirectory(item.name)) pendingDirectories.push(absolutePath);
      if (item.isFile() && item.name.endsWith(PARTITION_ENTRY_SUFFIX)) {
        entries.push({
          absolutePath,
          path: path.relative(root, absolutePath).split(path.sep).join('/'),
          parentPath: null,
        });
      }
    }
  }
  return entries.sort((left, right) => ordinal(left.path, right.path));
}

/** Assign ancestry from all discovered entries, before filtering candidates for loading. */
function assignParents(entries: Entry[]): void {
  const firstEntryInFolder = new Map<string, Entry>();
  for (const entry of entries) {
    const folder = path.posix.dirname(entry.path);
    if (!firstEntryInFolder.has(folder)) firstEntryInFolder.set(folder, entry);
  }
  for (const entry of entries) {
    let ancestor = path.posix.dirname(entry.path);
    while (ancestor !== '.') {
      ancestor = path.posix.dirname(ancestor);
      const parent = firstEntryInFolder.get(ancestor);
      if (parent) {
        entry.parentPath = parent.path;
        break;
      }
    }
  }
}

function selectEntryPaths(entries: Entry[], patterns: string[]): Entry[] {
  for (const pattern of patterns) {
    if (!entries.some(entry => path.posix.matchesGlob(entry.path, pattern))) {
      throw new CliError(`Path selector matched no entries: ${pattern}`, { selector: pattern });
    }
  }
  const candidates = patterns.length ? entries.filter(entry => patterns.some(pattern => path.posix.matchesGlob(entry.path, pattern))) : entries;
  const selectedFolders = new Set<string>();
  for (const entry of candidates) {
    const dir = path.posix.dirname(entry.path);
    if (selectedFolders.has(dir)) throw new CliError(`Ambiguous partition entries in folder: ${dir}`, { path: entry.path });
    selectedFolders.add(dir);
  }
  return candidates;
}

export async function discover(root: string, patterns: string[] = [], out?: string): Promise<Discovery> {
  patterns.forEach(validatePattern);
  const absoluteRoot = await realpath(root);
  const output = out ? await canonical(out) : undefined;
  const excludedOutput = output && contained(absoluteRoot, output) ? output : undefined;
  const entries = await collectEntries(absoluteRoot, excludedOutput);
  assignParents(entries);
  const candidates = selectEntryPaths(entries, patterns);

  // Build preflight protects every discovered source entry, including entries excluded from loading.
  const sourceIdentities = new Set<string>();
  if (output) {
    for (const entry of entries) {
      const identity = await fileIdentity(entry.absolutePath);
      if (identity) sourceIdentities.add(identity);
    }
  }
  return { entries: candidates, sourceIdentities };
}
