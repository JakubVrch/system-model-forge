import { helpText } from '@cli/arguments/help';
import { HELP_ACTION, type OutputFormat } from '@cli/arguments/options';
import { formatSuccess } from '@cli/output/result';

export type HelpResult = { command: typeof HELP_ACTION; data: { help: string } };

export function runHelp(format: OutputFormat): string {
  return formatSuccess(format, { command: HELP_ACTION, data: { help: helpText } }, () => helpText);
}
