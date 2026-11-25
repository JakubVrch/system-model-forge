import { LIST_ELEMENTS_COMMAND, type Invocation } from '@cli/arguments/options';
import { inspectElements } from '@cli/commands/list-elements/inspect';
import type { ListElementsSourceResult } from '@cli/commands/list-elements/result';
import type { LoadedCandidate } from '@cli/source/model';
import { selectExports } from '@cli/source/select';
import { runSourceCommand } from '@cli/source/child';

function runListElementsSource(
  { elements, diagrams, properties, limit }: Pick<Invocation, 'elements' | 'diagrams' | 'properties' | 'limit'>,
  selected: LoadedCandidate[],
): ListElementsSourceResult {
  const exports = selectExports(selected, elements, diagrams);
  return { kind: LIST_ELEMENTS_COMMAND, data: inspectElements(exports, properties, limit) };
}

runSourceCommand(import.meta.url, LIST_ELEMENTS_COMMAND, runListElementsSource);
