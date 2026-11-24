import { BUILD_COMMAND, type Invocation } from '@cli/arguments/options';
import { CliError, type BuildSummary } from '@cli/result';
import { discover } from '@cli/source/discover';
import { loadSources } from '@cli/source/source-process';
import { executeBuild } from '@cli/commands/build/write';

export async function runBuild(invocation: Extract<Invocation, { command: typeof BUILD_COMMAND }>): Promise<BuildSummary> {
  const { root, paths, out, dryRun } = invocation;
  const { entries, sourceIdentities } = await discover(root, paths, out);
  const response = await loadSources({ invocation, entries });
  if (response.kind !== BUILD_COMMAND) throw new CliError('Source child returned a result for the wrong command');
  return executeBuild(response.plan, root, out, dryRun, sourceIdentities);
}
