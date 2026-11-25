import { expect, it, vi } from 'vitest';
import { main } from '@cli/main';
import * as format from '@cli/commands/list-elements/format';
import * as sourceProcess from '@cli/source/source-process';
import { isTraceResponse } from '@cli/commands/trace-element/response';

it('reports a rendering error as a single JSON failure without partial success output', async () => {
  const exitCodeBefore = process.exitCode;
  const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
  const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
  const stringify = JSON.stringify;
  vi.spyOn(JSON, 'stringify').mockImplementation(value => {
    if (value?.success === true && value.command === 'help') throw new RangeError('Output exceeds string capacity');
    return stringify(value);
  });
  try {
    await main(['--help', '--format=json']);
    expect(process.exitCode).toBe(1);
    expect(stdout).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(stdout.mock.calls[0]?.[0]))).toEqual({
      schemaVersion: 1,
      command: 'help',
      success: false,
      data: null,
      error: { message: 'Output exceeds string capacity', context: {} },
    });
    expect(stderr).not.toHaveBeenCalled();
  } finally {
    vi.restoreAllMocks();
    process.exitCode = exitCodeBefore;
  }
});

it('reports a pretty renderer failure without affecting JSON output', async () => {
  const exitCodeBefore = process.exitCode;
  const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
  const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
  vi.spyOn(sourceProcess, 'loadSources').mockResolvedValue({ kind: 'list-elements', data: { selections: [] } });
  vi.spyOn(format, 'formatElements').mockImplementation(() => { throw new RangeError('Table is too large'); });
  try {
    await main(['list-elements', '--root', 'tests/integration/fixtures/cli/inspection']);
    expect(process.exitCode).toBe(1);
    expect(stdout).not.toHaveBeenCalled();
    expect(stderr.mock.calls.map(([text]) => text)).toEqual(['Table is too large\n']);

    await main(['list-elements', '--root', 'tests/integration/fixtures/cli/inspection', '--format=json']);
    expect(process.exitCode).toBe(0);
    expect(format.formatElements).toHaveBeenCalledTimes(1);
    expect(stdout).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(stdout.mock.calls[0]?.[0]))).toMatchObject({
      command: 'list-elements', success: true, data: { selections: [] }, error: null,
    });
  } finally {
    vi.restoreAllMocks();
    process.exitCode = exitCodeBefore;
  }
});

it('returns a trace argument error as one JSON document', async () => {
  const previous = process.exitCode;
  const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
  const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
  const load = vi.spyOn(sourceProcess, 'loadSources');
  try {
    await main(['trace-element', 'root', '--property', 'name', '--format=json']);
    expect(process.exitCode).toBe(1);
    expect(stdout).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(stdout.mock.calls[0]?.[0]))).toMatchObject({
      command: 'trace-element', success: false, data: null, error: { message: expect.stringContaining('--property') },
    });
    expect(stderr).not.toHaveBeenCalled();
    expect(load).not.toHaveBeenCalled();
  } finally {
    vi.restoreAllMocks();
    process.exitCode = previous;
  }
});

it('passes the explicit config and only path-selected entries to trace source loading', async () => {
  const previous = process.exitCode;
  const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
  const element = { id: 'shared', name: 'Shared', modelType: 'Shared', relationships: [] };
  const load = vi.spyOn(sourceProcess, 'loadSources').mockResolvedValue({
    kind: 'trace-element', data: { roots: [element] },
  });
  try {
    await main([
      'trace-element', 'shared', '--root', 'tests/integration/fixtures/cli/loading',
      '--path', 'a.partition.ts', '--tsconfig', 'tsconfig.json', '--format=json',
    ]);
    expect(process.exitCode).toBe(0);
    expect(load).toHaveBeenCalledWith({
      invocation: expect.objectContaining({ tsconfig: expect.stringMatching(/tsconfig\.json$/), paths: ['a.partition.ts'] }),
      entries: [expect.objectContaining({ path: 'a.partition.ts' })],
    }, expect.objectContaining({ pathname: expect.stringMatching(/trace-element\/run-source\.js$/) }), isTraceResponse);
    expect(stdout).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(stdout.mock.calls[0]?.[0])).data.roots).toEqual([element]);
  } finally {
    vi.restoreAllMocks();
    process.exitCode = previous;
  }
});
