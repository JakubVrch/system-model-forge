import { fork } from 'node:child_process';
import { createRequire } from 'node:module';
import { access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validResponse } from '@cli/source/ipc';
import { CHILD_ERROR_KIND, CliError, type ChildRequest, type ChildResponse, type ChildResult } from '@cli/result';

/** Give the loader time to close stdio before forcing exit for lingering authored handles. */
const CHILD_SHUTDOWN_GRACE_MS = 200;

async function tsconfigFor(request: ChildRequest): Promise<string | undefined> {
  const { root, tsconfig } = request.invocation;
  if (tsconfig) {
    await access(tsconfig);
    return tsconfig;
  }
  let directory = root;
  while (true) {
    const candidate = join(directory, 'tsconfig.json');
    try {
      await access(candidate);
      return candidate;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }

    const parent = dirname(directory);
    if (parent === directory) return undefined;
    directory = parent;
  }
}

export async function loadSources(
  request: ChildRequest,
  childUrl = new URL('./child.js', import.meta.url),
  diagnostics = (text: string) => { process.stderr.write(text); },
): Promise<ChildResult> {
  const tsconfig = await tsconfigFor(request);
  const env: NodeJS.ProcessEnv = { ...process.env, TSX_DISABLE_CACHE: '1' };
  delete env.TSX_TSCONFIG_PATH;
  if (tsconfig) env.TSX_TSCONFIG_PATH = tsconfig;
  const preload = pathToFileURL(createRequire(import.meta.url).resolve('tsx')).href;

  return new Promise((resolveResult, reject) => {
    const child = fork(childUrl, [], {
      execArgv: ['--import', preload],
      env,
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    });
    let response: ChildResponse | undefined;
    let problem: Error | undefined;
    let forceTimer: ReturnType<typeof setTimeout> | undefined;

    function terminate() {
      child.kill('SIGTERM');
      forceTimer ??= setTimeout(() => child.kill('SIGKILL'), CHILD_SHUTDOWN_GRACE_MS);
    }

    function interrupt() {
      problem = new CliError('Source loading interrupted');
      terminate();
    }

    process.once('SIGINT', interrupt);
    process.once('SIGTERM', interrupt);
    child.stdout?.on('data', chunk => diagnostics(String(chunk)));
    child.stderr?.on('data', chunk => diagnostics(String(chunk)));

    child.on('message', value => {
      if (response || problem) return;
      if (validResponse(value)) response = value;
      else problem = new CliError('Source child returned an invalid result');
      terminate();
    });

    child.on('error', error => { problem = error; });
    child.on('close', (code, signal) => {
      clearTimeout(forceTimer);
      process.removeListener('SIGINT', interrupt);
      process.removeListener('SIGTERM', interrupt);
      if (problem) reject(problem);
      else if (!response) reject(new CliError(`Source child exited without a result (${signal ?? code})`));
      else if (response.kind === CHILD_ERROR_KIND) reject(new CliError(response.error.message, response.error.context));
      else resolveResult(response);
    });

    child.send(request, error => {
      if (error) {
        problem = error;
        terminate();
      }
    });
  });
}
