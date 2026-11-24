import { LIST_ELEMENTS_COMMAND, type Invocation } from '@cli/arguments/options';
import { CliError, type InspectionResult } from '@cli/result';
import { discover } from '@cli/source/discover';
import { loadSources } from '@cli/source/source-process';

export async function runListElements(invocation: Invocation): Promise<InspectionResult> {
  const { root, paths } = invocation;
  const { entries } = await discover(root, paths);
  const response = await loadSources({ invocation, entries });
  if (response.kind !== LIST_ELEMENTS_COMMAND) throw new CliError('Source child returned a result for the wrong command');
  return response.data;
}
