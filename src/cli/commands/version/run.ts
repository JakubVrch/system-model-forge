import { readFile } from 'node:fs/promises';
import { VERSION_ACTION, type OutputFormat } from '@cli/arguments/options';
import { formatSuccess } from '@cli/output/result';

export type VersionResult = { command: typeof VERSION_ACTION; data: { version: string } };

export async function runVersion(format: OutputFormat): Promise<string> {
  const file = new URL('../../version.json', import.meta.url);
  const { version } = JSON.parse(await readFile(file, 'utf8')) as { version: string };
  return formatSuccess(format, { command: VERSION_ACTION, data: { version } }, () => version);
}
