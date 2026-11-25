import type { PARTITION_INFO_COMMAND } from '@cli/arguments/options';
import type { ParentIdentity, PartitionIdentity } from '@cli/source/model';

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

export type PartitionInfoResult = { command: typeof PARTITION_INFO_COMMAND; data: InventoryResult };

export type PartitionInfoSourceResult = { kind: typeof PARTITION_INFO_COMMAND; data: InventoryResult };
