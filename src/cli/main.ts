#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { CliError, failure } from '@cli/errors';
import {
  BUILD_COMMAND, HELP_ACTION, JSON_OUTPUT_FORMAT, LIST_ELEMENTS_COMMAND, PARTITION_INFO_COMMAND, TRACE_ELEMENT_COMMAND, VERSION_ACTION,
  parseOptions, recognizedCommand, requestedFormat, type Invocation,
} from '@cli/arguments/options';
import { formatBuild } from '@cli/commands/build/format';
import { runBuild } from '@cli/commands/build/run';
import { runHelp } from '@cli/commands/help/run';
import { runListElements } from '@cli/commands/list-elements/run';
import { runPartitionInfo } from '@cli/commands/partition-info/run';
import { runTraceElement } from '@cli/commands/trace-element/run';
import { runVersion } from '@cli/commands/version/run';
import { plain } from '@cli/output/format';
import { jsonLine, OUTPUT_SCHEMA_VERSION, type Envelope } from '@cli/output/result';

function runCommand(invocation: Invocation): string | Promise<string> {
  switch (invocation.command) {
    case HELP_ACTION: return runHelp(invocation.format);
    case VERSION_ACTION: return runVersion(invocation.format);
    case BUILD_COMMAND: return runBuild(invocation);
    case LIST_ELEMENTS_COMMAND: return runListElements(invocation);
    case TRACE_ELEMENT_COMMAND: return runTraceElement(invocation);
    case PARTITION_INFO_COMMAND: return runPartitionInfo(invocation);
  }
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
    output = await runCommand(invocation);
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
