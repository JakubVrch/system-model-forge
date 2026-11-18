import type { Partition, GraphElement } from '../core/index.ts';

export type Command = 'build' | 'list-elements' | 'partition-info';
export type Invocation = {
  command: Command | 'help' | 'version'; root: string; format: 'pretty' | 'json'; tsconfig?: string;
  ids: string[]; names: string[]; paths: string[]; elements: string[]; diagrams: string[]; properties: string[];
  limit?: number; out?: string; dryRun: boolean;
};
export type Entry = { absolutePath: string; path: string; parentPath: string | null };
export type LoadedCandidate = { entry: Entry; partition: Partition };
export type PartitionIdentity = { id: string; name: string; path: string };
export type ParentIdentity = { path: string; id?: string; name?: string };
export type SelectedExport = { partition: PartitionIdentity; export: { group: 'elements' | 'diagrams'; key: string }; members: ReadonlySet<GraphElement> };
export type AttributeValue = string | number | null | undefined;
export type Identity = { id: string; name?: AttributeValue; label?: AttributeValue };
export type EndpointView = { ref: string; modelType: string | null; identity: Identity; inExport: boolean };
export type ElementView = { ref: string; kind: 'node' | 'edge'; modelType: string | null; identity: Identity; attributes: Record<string, AttributeValue>; endpoints?: { from: EndpointView | null; to: EndpointView | null } };
export type GroupResult = { total: number; returned: number; omitted: number; items: ElementView[] };
export type InspectionResult = { selections: { partition: PartitionIdentity; export: SelectedExport['export']; nodes: GroupResult; edges: GroupResult }[] };
export type InventoryResult = { partitions: (PartitionIdentity & { parent: ParentIdentity | null; exports: { elements: { key: string; nodes: number; edges: number }[]; diagrams: { key: string; nodes: number; edges: number; fileExtension: string }[]; metamodel: string[] } })[] };
export type BuildArtifact = { partitionPath: string; diagramKey: string; path: string };
export type BuildPlan = { partitions: (PartitionIdentity & { artifacts: (BuildArtifact & { text: string })[] })[] };
export type BuildSummary = { dryRun: boolean; partitions: (PartitionIdentity & { diagrams: string[] })[]; exportedFiles: number; plannedFiles?: number; artifacts?: BuildArtifact[] };
export type ErrorContext = Partial<Record<'path' | 'partitionId' | 'exportGroup' | 'exportKey' | 'selector' | 'destination', string>>;
export type Failure = { message: string; context: ErrorContext };
export type Envelope =
  | { schemaVersion: 1; command: Command | 'help' | 'version'; success: true; data: BuildSummary | InventoryResult | InspectionResult | { help: string } | { version: string }; error: null }
  | { schemaVersion: 1; command: Command | null | 'help' | 'version'; success: false; data: BuildSummary | null; error: Failure };
export type ChildRequest = { invocation: Invocation; entries: Entry[] };
export type ChildResponse = { kind: 'build'; plan: BuildPlan } | { kind: 'list-elements'; data: InspectionResult } | { kind: 'partition-info'; data: InventoryResult } | { kind: 'error'; error: Failure };

export class CliError extends Error {
  constructor(message: string, public readonly context: ErrorContext = {}, public readonly partial: BuildSummary | null = null) { super(message); }
}
export function failure(error: unknown): Failure {
  return { message: error instanceof Error ? error.message : String(error), context: error instanceof CliError ? error.context : {} };
}
export const ordinal = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
