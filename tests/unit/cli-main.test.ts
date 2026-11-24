import { expect, it, vi } from 'vitest';
import { main } from '@cli/main';
import * as format from '@cli/output/format';
import * as sourceProcess from '@cli/source/source-process';

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

it('reports a pretty renderer failure concisely on stderr', async () => {
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
  } finally {
    vi.restoreAllMocks();
    process.exitCode = exitCodeBefore;
  }
});
