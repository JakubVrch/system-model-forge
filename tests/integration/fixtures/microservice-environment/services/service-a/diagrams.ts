import { connectedNodes, cleanSelection, filterSet, unionSet, exportDiagram } from '@core';
import { partition as services } from '../services.partition.ts';
import { localModel } from './elements.ts';
const { service, eventFlow } = services.metamodel;
const starts = filterSet(localModel, service.is);
const reached = connectedNodes(starts, eventFlow.is, 'outgoing');
const data = cleanSelection(unionSet(localModel, reached));
export const eventOverview = { data, inNotation: exportDiagram(data, 'C4Component\ntitle Service A events', '') };
