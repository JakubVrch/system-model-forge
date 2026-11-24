#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  CliError, failure, OUTPUT_SCHEMA_VERSION, type CommandSuccess, type Envelope,
} from '@cli/result';
import {
  BUILD_COMMAND, HELP_ACTION, JSON_OUTPUT_FORMAT, LIST_ELEMENTS_COMMAND, PARTITION_INFO_COMMAND, VERSION_ACTION,
  parseOptions, recognizedCommand, requestedFormat, type Invocation,
} from '@cli/arguments/options';
import { helpText } from '@cli/arguments/help';
import { runBuild } from '@cli/commands/build/run';
import { runListElements } from '@cli/commands/list-elements/run';
import { runPartitionInfo } from '@cli/commands/partition-info/run';
import { formatBuild, formatElements, formatInventory, plain } from '@cli/output/format';

async function invoke(invocation: Invocation): Promise<CommandSuccess> {
  switch (invocation.command) {
    case HELP_ACTION:
      return { command: HELP_ACTION, data: { help: helpText } };
    case VERSION_ACTION: {
      const metadata = JSON.parse(await readFile(new URL('./version.json', import.meta.url), 'utf8')) as { version: string };
      return { command: VERSION_ACTION, data: { version: metadata.version } };
    }
    case BUILD_COMMAND:
      return { command: BUILD_COMMAND, data: await runBuild(invocation) };
    case LIST_ELEMENTS_COMMAND:
      return { command: LIST_ELEMENTS_COMMAND, data: await runListElements(invocation) };
    case PARTITION_INFO_COMMAND:
      return { command: PARTITION_INFO_COMMAND, data: await runPartitionInfo(invocation) };
  }
}

function renderSuccess(result: CommandSuccess): string {
  switch (result.command) {
    case HELP_ACTION: return result.data.help;
    case VERSION_ACTION: return result.data.version;
    case BUILD_COMMAND: return formatBuild(result.data);
    case LIST_ELEMENTS_COMMAND: return formatElements(result.data);
    case PARTITION_INFO_COMMAND: return formatInventory(result.data);
  }
}

function jsonLine(envelope: Envelope): string {
  return `${JSON.stringify(envelope)}\n`;
}

export async function main(args = process.argv.slice(2)): Promise<void> {
  let format = requestedFormat(args);
  let command: Envelope['command'] = recognizedCommand(args);
  let output: string;
  let status = 0;
  try {
    const invocation = parseOptions(args);
    format = invocation.format;
    command = invocation.command;
    const result = await invoke(invocation);
    output = format === JSON_OUTPUT_FORMAT
      ? jsonLine({ schemaVersion: OUTPUT_SCHEMA_VERSION, ...result, success: true, error: null })
      : `${renderSuccess(result)}\n`;
  } catch (error) {
    status = 1;
    const partial = error instanceof CliError ? error.partial : null;
    const problem = failure(error);
    if (format === JSON_OUTPUT_FORMAT) {
      const envelope: Envelope = {
        schemaVersion: OUTPUT_SCHEMA_VERSION, command, success: false, data: partial, error: problem,
      };
      try {
        output = jsonLine(envelope);
      } catch (renderError) {
        if (!partial) throw renderError;
        output = jsonLine({ ...envelope, data: null });
      }
    } else {
      output = '';
      if (partial) {
        try {
          output = `${formatBuild(partial)}\n`;
        } catch {
          // Keep the original build error if its partial summary cannot render.
        }
      }
      process.stderr.write(`${plain(problem.message)}\n`);
    }
  }
  if (output) process.stdout.write(output);
  process.exitCode = status;
}

if (process.argv[1] && pathToFileURL(realpathSync(resolve(process.argv[1]))).href === import.meta.url) await main();
