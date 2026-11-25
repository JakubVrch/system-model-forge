import type { GraphElement, Partition } from '@core';

export const ELEMENT_EXPORT_GROUP = 'elements';
export const DIAGRAM_EXPORT_GROUP = 'diagrams';
export type ExportGroup = typeof ELEMENT_EXPORT_GROUP | typeof DIAGRAM_EXPORT_GROUP;

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

export type ExportIdentity = {
  group: ExportGroup;
  key: string;
};

export type SelectedExport = {
  partition: PartitionIdentity;
  export: ExportIdentity;
  members: ReadonlySet<GraphElement>;
};

export type Identity = {
  id: string;
  name: string;
};
