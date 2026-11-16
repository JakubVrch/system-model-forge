import { service as createService, module, moduleComposition, eventFlow, databaseUsage } from '@metamodel';
import { connectedNodes, cleanSelection, filterSet, unionSet, readonlySet } from '@core';
import { sharedTopic, topicB } from '@fixtures/microservice-environment/infrastructure/topics';
import { databaseB } from '@fixtures/microservice-environment/infrastructure/databases';

export const service = createService('serviceB', 'Service B');
const moduleInstances = [
  module('moduleB1', 'Module B1'),
  module('moduleB2', 'Module B2'),
] as const;
export const modules = readonlySet(moduleInstances);
export const relationships = readonlySet([
  moduleComposition(service, moduleInstances[0]),
  moduleComposition(service, moduleInstances[1]),
  eventFlow(service, sharedTopic, 'subscribe'),
  eventFlow(service, topicB, 'publish'),
  databaseUsage(service, databaseB),
]);
export const localModel = unionSet([service], modules, relationships);
const starts = filterSet(localModel, createService.is);
const reached = connectedNodes(starts, eventFlow.is, 'outgoing');
export const eventOverview = cleanSelection(unionSet(localModel, reached));
