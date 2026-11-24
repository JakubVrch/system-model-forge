import { expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { temporaryDirectory } from './cli-helpers.ts';
const exec = promisify(execFile);
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
it('packs and installs production-only core, declarations, child and executable in a clean consumer', async () => {
 await using temp = await temporaryDirectory();
 await exec(npm, ['pack','--json','--pack-destination',temp.path], { cwd: process.cwd(), shell: process.platform === 'win32' });
 const archive = (await readdir(temp.path)).find(name => name.endsWith('.tgz'))!;
 const consumer = join(temp.path,'consumer'); await mkdir(consumer);
 await writeFile(join(consumer,'package.json'), '{"private":true,"type":"module"}');
 await exec(npm,['install','--omit=dev','--no-audit','--no-fund',join(temp.path,archive)], { cwd: consumer, timeout: 90000, shell: process.platform === 'win32' });
 const packageDir = join(consumer,'node_modules/governed-model-core');
 const metadata = JSON.parse(await readFile(join(packageDir,'package.json'),'utf8'));
 expect(metadata.bin['model-forge']).toBe('dist/cli/main.js');
 expect(await readFile(join(packageDir,'dist/core/index.d.ts'),'utf8')).toContain('Node');
 expect(await readdir(packageDir)).not.toContain('src');
 expect(await readdir(join(consumer,'node_modules'))).not.toContain('vitest');
 await writeFile(join(consumer,'model.partition.ts'), "import { Edge, Node, definePartition } from 'governed-model-core'; class Service extends Node { name='Installed'; from='Prague'; to='Brno'; } class Calls extends Edge {} const n=new Service('n'); const e=new Calls(undefined, undefined, 'e'); export const partition=definePartition({id:'installed',name:'Installed',elements:{all:new Set([n,e])},diagrams:{chart:{data:new Set([n]),inNotation:'installed exact',fileExtension:'.txt'}}});");
 const binary = join(consumer,'node_modules/.bin',process.platform === 'win32' ? 'model-forge.cmd' : 'model-forge');
 for (const args of [['--help'],['--version'],['partition-info'],['list-elements'],['build','--out','out']]) {
  const { stdout } = await exec(binary,[...args,'--format=json'], { cwd: consumer, timeout: 15000, shell: process.platform === 'win32' });
  const doc=JSON.parse(stdout); expect(doc.success).toBe(true);
  if (args[0] === 'list-elements') {
   const { nodes, edges } = doc.data.selections[0];
   expect(nodes.items[0]).toMatchObject({ kind: 'node', modelType: 'Service', attributes: { from: 'Prague', to: 'Brno' } });
   expect(edges.items[0]).toMatchObject({ kind: 'edge', modelType: 'Calls', endpoints: { from: null, to: null }, attributes: {} });
  }
 }
 expect(await readFile(join(consumer,'out/chart.txt'),'utf8')).toBe('installed exact');
 const runtime = await exec(process.execPath,['--input-type=module','-e',"import {Node} from 'governed-model-core'; console.log(new Node('id').id)"],{cwd:consumer}); expect(runtime.stdout.trim()).toBe('id');
 const compiler = resolve('node_modules/typescript/bin/tsc');
 await writeFile(join(consumer,'check.ts'), "import { Node } from 'governed-model-core'; const n: Node = new Node('id'); console.log(n.id);");
 await exec(process.execPath,[compiler,'--noEmit','--skipLibCheck','--module','NodeNext','--target','ES2023','check.ts'],{cwd:consumer});
},120000);
