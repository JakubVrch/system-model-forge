import { realpath, stat } from 'node:fs/promises';
import path from 'node:path';

export function contained(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}
/** Resolve existing ancestors too, so a not-yet-created output under an alias is pruned. */
export async function canonical(target: string): Promise<string> {
  try {
    return await realpath(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    const parent = path.dirname(target);
    if (parent === target) throw error;
    return path.join(await canonical(parent), path.basename(target));
  }
}
/** A missing path can also have a parent component that is a regular file. */
export function isMissingPath(error: unknown): boolean {
  const code = (error as NodeJS.ErrnoException).code;
  return code === 'ENOENT' || code === 'ENOTDIR';
}

export async function fileIdentity(target: string): Promise<string | undefined> {
  try {
    const info = await stat(target, { bigint: true });
    return info.isFile() ? `${info.dev}:${info.ino}` : undefined;
  } catch (error) {
    if (isMissingPath(error)) return undefined;
    throw error;
  }
}

/** Filename convention for authored partition entry modules. */
export const PARTITION_ENTRY_SUFFIX = '.partition.ts';
