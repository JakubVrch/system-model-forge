import type { BUILD_COMMAND } from '@cli/arguments/options';
import type { PartitionIdentity } from '@cli/source/model';

export type BuildArtifact = {
  partitionPath: string;
  diagramKey: string;
  path: string;
};

type PlannedArtifact = BuildArtifact & { text: string };

export type PlannedPartition = PartitionIdentity & { artifacts: PlannedArtifact[] };
export type BuildPlan = { partitions: PlannedPartition[] };

type ProcessedPartition = PartitionIdentity & { diagrams: string[] };

export type BuildSummary = {
  dryRun: boolean;
  partitions: ProcessedPartition[];
  exportedFiles: number;
  plannedFiles?: number;
  artifacts?: BuildArtifact[];
};

export type BuildResult = { command: typeof BUILD_COMMAND; data: BuildSummary };

export type BuildSourceResult = { kind: typeof BUILD_COMMAND; plan: BuildPlan };
