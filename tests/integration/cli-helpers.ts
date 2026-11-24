import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, realpath, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function temporaryDirectory() {
  const path = await realpath(await mkdtemp(join(tmpdir(), 'model-forge-')));
  return { path, async [Symbol.asyncDispose]() { await rm(path, { recursive: true, force: true }); } };
}

export function runCli(args: string[], cwd = process.cwd(), executable = resolve('dist/cli/main.js')) {
  return new Promise<{ stdout: string; stderr: string; status: number | null }>((resolveResult, reject) => {
    const child = spawn(process.execPath, [executable, ...args], { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('CLI timed out')); }, 15000);
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', status => { clearTimeout(timer); resolveResult({ stdout, stderr, status }); });
  });
}

export async function linkBuiltPackage(directory: string): Promise<void> {
  const packageRoot = fileURLToPath(new URL('../../', import.meta.url));
  const modules = join(directory, 'node_modules');
  await mkdir(modules, { recursive: true });
  await symlink(packageRoot, join(modules, 'governed-model-core'), 'junction');
}
