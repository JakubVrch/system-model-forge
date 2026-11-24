import type { GraphElement, Partition } from '@core';
import type {
  Action, BUILD_COMMAND, HELP_ACTION, Invocation, LIST_ELEMENTS_COMMAND, PARTITION_INFO_COMMAND, VERSION_ACTION,
} from '@cli/arguments/options';

/** Version of the JSON document emitted on stdout. */
export const OUTPUT_SCHEMA_VERSION = 1;

export const ELEMENT_EXPORT_GROUP = 'elements';
export const DIAGRAM_EXPORT_GROUP = 'diagrams';
export type ExportGroup = typeof ELEMENT_EXPORT_GROUP | typeof DIAGRAM_EXPORT_GROUP;

export const IDENTITY_ATTRIBUTE_KEYS = ['name', 'label'] as const;
export const CHILD_ERROR_KIND = 'error';

export type Entry = {
  absolutePath: string;
  path: string;
  parentPath: string | null;
};

export type LoadedCandidate = {
  entry: Entry;
  partition: Partition;
};

export type PartitionIdentity = {
  id: string;
  name: string;
  path: string;
};

export type ParentIdentity = {
  path: string;
  id?: string;
  name?: string;
};

type ExportIdentity = {
  group: ExportGroup;
  key: string;
};

export type SelectedExport = {
  partition: PartitionIdentity;
  export: ExportIdentity;
  members: ReadonlySet<GraphElement>;
};

export type AttributeValue = string | number | null | undefined;

export type Identity = {
  id: string;
  name?: AttributeValue;
  label?: AttributeValue;
};

export type EndpointView = {
  modelType: string | null;
  identity: Identity;
  inExport: boolean;
};

export type ElementView = {
  modelType: string | null;
  identity: Identity;
  attributes: Record<string, AttributeValue>;
} & (
  | { kind: 'node'; endpoints?: never }
  | { kind: 'edge'; endpoints: { from: EndpointView | null; to: EndpointView | null } }
);

export type GroupResult = {
  total: number;
  returned: number;
  omitted: number;
  items: ElementView[];
};

type InspectionSelection = {
  partition: PartitionIdentity;
  export: ExportIdentity;
  nodes: GroupResult;
  edges: GroupResult;
};

export type InspectionResult = { selections: InspectionSelection[] };

export type ExportCounts = {
  key: string;
  nodes: number;
  edges: number;
};

type DiagramInventory = ExportCounts & { fileExtension: string };

type PartitionInventory = PartitionIdentity & {
  parent: ParentIdentity | null;
  exports: {
    elements: ExportCounts[];
    diagrams: DiagramInventory[];
    metamodel: string[];
  };
};

export type InventoryResult = { partitions: PartitionInventory[] };

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

export type ErrorContext = Partial<Record<
  'path' | 'partitionId' | 'exportGroup' | 'exportKey' | 'selector' | 'destination', string
>>;

export type Failure = {
  message: string;
  context: ErrorContext;
};

export type CommandSuccess =
  | { command: typeof HELP_ACTION; data: { help: string } }
  | { command: typeof VERSION_ACTION; data: { version: string } }
  | { command: typeof BUILD_COMMAND; data: BuildSummary }
  | { command: typeof LIST_ELEMENTS_COMMAND; data: InspectionResult }
  | { command: typeof PARTITION_INFO_COMMAND; data: InventoryResult };

type SuccessEnvelope = CommandSuccess & {
  schemaVersion: typeof OUTPUT_SCHEMA_VERSION;
  success: true;
  error: null;
};

type FailureEnvelope = {
  schemaVersion: typeof OUTPUT_SCHEMA_VERSION;
  command: Action | null;
  success: false;
  data: BuildSummary | null;
  error: Failure;
};

export type Envelope = SuccessEnvelope | FailureEnvelope;

export type ChildRequest = {
  invocation: Invocation;
  entries: Entry[];
};

export type ChildResult =
  | { kind: typeof BUILD_COMMAND; plan: BuildPlan }
  | { kind: typeof LIST_ELEMENTS_COMMAND; data: InspectionResult }
  | { kind: typeof PARTITION_INFO_COMMAND; data: InventoryResult };

export type ChildResponse = ChildResult | { kind: typeof CHILD_ERROR_KIND; error: Failure };

export class CliError extends Error {
  constructor(
    message: string,
    public readonly context: ErrorContext = {},
    public readonly partial: BuildSummary | null = null,
  ) {
    super(message);
  }
}

export function failure(error: unknown): Failure {
  return {
    message: error instanceof Error ? error.message : String(error),
    context: error instanceof CliError ? error.context : {},
  };
}

export function ordinal(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
