import type { BuildSummary } from '@cli/commands/build/result';
import { plain } from '@cli/output/format';

export function formatBuild(summary: BuildSummary): string {
  const lines = summary.partitions.map(p => `${plain(p.path)} (${plain(p.id)}; ${plain(p.name)}): ${p.diagrams.length ? p.diagrams.map(key => plain(JSON.stringify(key))).join(', ') : '(no diagrams)'}`);
  if (summary.dryRun) {
    lines.unshift('Dry run');
    for (const artifact of summary.artifacts ?? []) lines.push(`${plain(artifact.partitionPath)} / ${plain(JSON.stringify(artifact.diagramKey))} -> ${plain(artifact.path)}`);
    lines.push(`Planned files: ${summary.plannedFiles ?? 0}`);
  }
  lines.push(`Exported files: ${summary.exportedFiles}`);
  return lines.join('\n');
}
