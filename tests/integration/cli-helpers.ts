import { spawn } from 'node:child_process';
import { mkdtemp, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

export async function temporaryDirectory() {
  const path = await realpath(await mkdtemp(join(tmpdir(), 'model-forge-')));
  return { path, async [Symbol.asyncDispose]() { await rm(path, { recursive: true, force: true }); } };
}

export function runCli(args: string[], cwd = process.cwd()) {
  return new Promise<{ stdout: string; stderr: string; status: number | null }>((resolveResult, reject) => {
    const child = spawn(process.execPath, [resolve('dist/cli/main.js'), ...args], { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('CLI timed out')); }, 15000);
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', status => { clearTimeout(timer); resolveResult({ stdout, stderr, status }); });
  });
}
