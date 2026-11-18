import { execFileSync } from 'node:child_process';
export default function setup() {
  execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.build.json'], { stdio: 'inherit' });
}
