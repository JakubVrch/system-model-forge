import { BUILD_COMMAND, type Invocation } from '@cli/arguments/options';
import { formatBuild } from '@cli/commands/build/format';
import { formatSuccess } from '@cli/output/result';
import { discover } from '@cli/source/discover';
import { loadSources } from '@cli/source/source-process';
import { isBuildResponse } from '@cli/commands/build/response';
import { executeBuild } from '@cli/commands/build/write';

export async function runBuild(invocation: Extract<Invocation, { command: typeof BUILD_COMMAND }>): Promise<string> {
  const { root, paths, out, dryRun } = invocation;
  const { entries, sourceIdentities } = await discover(root, paths, out);
  const childUrl = new URL('./run-source.js', import.meta.url);
  const response = await loadSources({ invocation, entries }, childUrl, isBuildResponse);
  const data = await executeBuild(response.plan, root, out, dryRun, sourceIdentities);
  return formatSuccess(invocation.format, { command: BUILD_COMMAND, data }, () => formatBuild(data));
}
