import type { LIST_ELEMENTS_COMMAND } from '@cli/arguments/options';
import type { ExportIdentity, Identity, PartitionIdentity } from '@cli/source/model';

export type AttributeValue = string | number | null | undefined;

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

export type ListElementsResult = { command: typeof LIST_ELEMENTS_COMMAND; data: InspectionResult };

export type ListElementsSourceResult = { kind: typeof LIST_ELEMENTS_COMMAND; data: InspectionResult };
