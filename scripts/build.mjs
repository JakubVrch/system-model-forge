import { replaceTscAliasPaths } from 'tsc-alias';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('../', import.meta.url));
const compiler = createRequire(import.meta.url).resolve('typescript/bin/tsc');
const { version } = JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8'));
if (typeof version !== 'string' || !version) throw new Error('package.json requires a version');

const scratch = join(repo, 'build');
mkdirSync(scratch, { recursive: true });
const output = mkdtempSync(join(scratch, 'model-forge-'));
const dist = join(repo, 'dist');
try {
  execFileSync(process.execPath, [compiler, '-p', 'tsconfig.build.json', '--outDir', output], {
    cwd: repo,
    stdio: 'inherit',
  });
  await replaceTscAliasPaths({
    configFile: join(repo, 'tsconfig.build.json'),
    outDir: output,
    resolveFullPaths: true,
  });
  writeFileSync(join(output, 'cli', 'version.json'), JSON.stringify({ version }) + '\n');
  // Replace the generated tree only after a successful compile so renamed modules cannot leak into the package.
  rmSync(dist, { recursive: true, force: true });
  renameSync(output, dist);
} finally {
  rmSync(output, { recursive: true, force: true });
}
