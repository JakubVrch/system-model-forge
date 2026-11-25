import { BUILD_COMMAND } from '@cli/arguments/options';
import { buildPlan } from '@cli/commands/build/plan';
import type { BuildSourceResult } from '@cli/commands/build/result';
import type { LoadedCandidate } from '@cli/source/model';
import { runSourceCommand } from '@cli/source/child';

function runBuildSource(selected: LoadedCandidate[]): BuildSourceResult {
  return { kind: BUILD_COMMAND, plan: buildPlan(selected) };
}

runSourceCommand(import.meta.url, BUILD_COMMAND, (_invocation, selected) => runBuildSource(selected));
