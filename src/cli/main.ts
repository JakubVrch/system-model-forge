#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fork } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CliError, failure, type ChildRequest, type ChildResponse, type Envelope } from './result.ts';
import { helpText, parseOptions, recognizedCommand, requestedFormat } from './options.ts';
import { discover } from './discover.ts';
import { executeBuild } from './build.ts';
import { formatBuild, formatElements, formatInventory, plain } from './format.ts';

async function tsconfigFor(request: ChildRequest): Promise<string | undefined> {
  if (request.invocation.tsconfig) { await access(request.invocation.tsconfig); return request.invocation.tsconfig; }
  let directory = request.invocation.root;
  while (true) {
    const candidate = join(directory, 'tsconfig.json');
    try { await access(candidate); return candidate; } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
    const parent = dirname(directory);
    if (parent === directory) return undefined;
    directory = parent;
  }
}
function isRecord(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function strings(value: Record<string, unknown>, keys: string[]): boolean { return keys.every(key => typeof value[key] === 'string'); }
function attribute(value: unknown): boolean { return value === null || typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value)); }
function identity(value: unknown): boolean {
  return isRecord(value) && typeof value.id === 'string' && ['name', 'label'].every(k => !(k in value) || attribute(value[k]));
}
function endpoint(value: unknown): boolean {
  return value === null || (isRecord(value) && typeof value.ref === 'string' && (value.modelType === null || typeof value.modelType === 'string') && identity(value.identity) && typeof value.inExport === 'boolean');
}
function group(value: unknown, kind: 'node' | 'edge'): boolean {
  if (!isRecord(value) || !['total', 'returned', 'omitted'].every(k => Number.isSafeInteger(value[k]) && (value[k] as number) >= 0) || !Array.isArray(value.items)) return false;
  return value.items.length === value.returned && (value.returned as number) + (value.omitted as number) === value.total && value.items.every(item =>
    isRecord(item) && item.kind === kind && typeof item.ref === 'string' && (item.modelType === null || typeof item.modelType === 'string') && identity(item.identity) && isRecord(item.attributes) && Object.values(item.attributes).every(attribute) &&
    (kind === 'node' ? !('endpoints' in item) : isRecord(item.endpoints) && endpoint(item.endpoints.from) && endpoint(item.endpoints.to)));
}
function validResponse(value: unknown): value is ChildResponse {
  if (!isRecord(value)) return false;
  if (value.kind === 'error') return isRecord(value.error) && typeof value.error.message === 'string' && isRecord(value.error.context) && Object.values(value.error.context).every(v => typeof v === 'string');
  if (value.kind === 'list-elements') return isRecord(value.data) && Array.isArray(value.data.selections) && value.data.selections.every(s => isRecord(s) && isRecord(s.partition) && strings(s.partition, ['id','name','path']) && isRecord(s.export) && ['elements','diagrams'].includes(s.export.group as string) && typeof s.export.key === 'string' && group(s.nodes, 'node') && group(s.edges, 'edge'));
  if (value.kind === 'partition-info') return isRecord(value.data) && Array.isArray(value.data.partitions) && value.data.partitions.every(p => {
    if (!isRecord(p) || !strings(p, ['id','name','path']) || !(p.parent === null || (isRecord(p.parent) && typeof p.parent.path === 'string' && ['id','name'].every(k => !(k in (p.parent as object)) || typeof (p.parent as Record<string, unknown>)[k] === 'string'))) || !isRecord(p.exports)) return false;
    return ['elements','diagrams'].every(key => Array.isArray((p.exports as Record<string, unknown>)[key]) && ((p.exports as Record<string, unknown>)[key] as unknown[]).every(e => isRecord(e) && typeof e.key === 'string' && ['nodes','edges'].every(k => Number.isSafeInteger(e[k]) && (e[k] as number) >= 0) && (key === 'elements' || typeof e.fileExtension === 'string'))) && Array.isArray(p.exports.metamodel) && p.exports.metamodel.every(k => typeof k === 'string');
  });
  if (value.kind !== 'build' || !isRecord(value.plan) || !Array.isArray(value.plan.partitions)) return false;
  return value.plan.partitions.every(p => isRecord(p) && strings(p, ['id', 'name', 'path']) && Array.isArray(p.artifacts) && p.artifacts.every(a => isRecord(a) && strings(a, ['partitionPath', 'diagramKey', 'path', 'text']) && a.partitionPath === p.path));
}
export async function loadSources(request: ChildRequest, childUrl = new URL('./child.js', import.meta.url), diagnostics = (text: string) => { process.stderr.write(text); }): Promise<Exclude<ChildResponse, { kind: 'error' }>> {
  const tsconfig = await tsconfigFor(request);
  const env: NodeJS.ProcessEnv = { ...process.env, TSX_DISABLE_CACHE: '1' };
  delete env.TSX_TSCONFIG_PATH;
  if (tsconfig) Object.assign(env, { TSX_TSCONFIG_PATH: tsconfig });
  const preload = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href;
  return new Promise((resolveResult, reject) => {
    const child = fork(childUrl, [], { execArgv: ['--import', preload], env, stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
    let response: ChildResponse | undefined;
    let problem: Error | undefined;
    let forceTimer: ReturnType<typeof setTimeout> | undefined;
    const terminate = () => {
      child.kill('SIGTERM');
      forceTimer ??= setTimeout(() => child.kill('SIGKILL'), 200);
    };
    const interrupt = () => { problem = new CliError('Source loading interrupted'); terminate(); };
    process.once('SIGINT', interrupt); process.once('SIGTERM', interrupt);
    child.stdout?.on('data', chunk => diagnostics(String(chunk)));
    child.stderr?.on('data', chunk => diagnostics(String(chunk)));
    child.on('message', value => {
      if (response || problem) return;
      if (!validResponse(value)) problem = new CliError('Source child returned an invalid result');
      else response = value;
      terminate();
    });
    child.on('error', error => { problem = error; });
    child.on('close', (code, signal) => {
      clearTimeout(forceTimer);
      process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt);
      if (problem) reject(problem);
      else if (!response) reject(new CliError(`Source child exited without a result (${signal ?? code})`));
      else if (response.kind === 'error') reject(new CliError(response.error.message, response.error.context));
      else resolveResult(response);
    });
    child.send(request, error => { if (error) { problem = error; terminate(); } });
  });
}

export async function main(args = process.argv.slice(2)): Promise<void> {
  let format = requestedFormat(args);
  let command: Envelope['command'] = recognizedCommand(args);
  let envelope: Envelope;
  try {
    const invocation = parseOptions(args);
    format = invocation.format; command = invocation.command;
    if (command === 'help') {
      envelope = { schemaVersion: 1, command, success: true, data: { help: helpText(recognizedCommand(args)) }, error: null };
    } else if (command === 'version') {
      const metadata = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8')) as { version: string };
      envelope = { schemaVersion: 1, command, success: true, data: { version: metadata.version }, error: null };
    } else {
      const entries = await discover(invocation.root, invocation.paths, invocation.out);
      const response = await loadSources({ invocation, entries });
      if (response.kind !== command) throw new CliError('Source child returned a result for the wrong command');
      const data = response.kind === 'build' ? await executeBuild(response.plan, invocation.root, invocation.out!, invocation.dryRun) : response.data;
      envelope = { schemaVersion: 1, command, success: true, data, error: null };
    }
  } catch (error) {
    envelope = { schemaVersion: 1, command, success: false, data: error instanceof CliError ? error.partial : null, error: failure(error) };
  }
  if (format === 'json') process.stdout.write(`${JSON.stringify(envelope)}\n`);
  else if (envelope.success) process.stdout.write(`${'help' in envelope.data ? envelope.data.help : 'version' in envelope.data ? envelope.data.version : 'exportedFiles' in envelope.data ? formatBuild(envelope.data) : 'selections' in envelope.data ? formatElements(envelope.data) : formatInventory(envelope.data)}\n`);
  else {
    if (envelope.data) process.stdout.write(`${formatBuild(envelope.data)}\n`);
    process.stderr.write(`${plain(envelope.error.message)}\n`);
  }
  process.exitCode = envelope.success ? 0 : 1;
}
if (process.argv[1] && pathToFileURL(realpathSync(resolve(process.argv[1]))).href === import.meta.url) await main();
