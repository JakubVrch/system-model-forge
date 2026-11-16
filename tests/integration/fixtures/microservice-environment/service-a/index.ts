import { service as createService, module, moduleComposition, eventFlow, databaseUsage } from '@metamodel';
import { connectedNodes, cleanSelection, filterSet, unionSet, readonlySet } from '@core';
import { sharedTopic, topicA } from '@fixtures/microservice-environment/infrastructure/topics';
import { databaseA } from '@fixtures/microservice-environment/infrastructure/databases';

export const service = createService('serviceA', 'Service A');
const moduleInstances = [
  module('moduleA1', 'Module A1'),
  module('moduleA2', 'Module A2'),
] as const;
export const modules = readonlySet(moduleInstances);
export const relationships = readonlySet([
  moduleComposition(service, moduleInstances[0]),
  moduleComposition(service, moduleInstances[1]),
  eventFlow(service, sharedTopic, 'publish'),
  eventFlow(service, sharedTopic, 'subscribe'),
  eventFlow(service, topicA, 'publish'),
  databaseUsage(service, databaseA),
]);
export const localModel = unionSet([service], modules, relationships);
const starts = filterSet(localModel, createService.is);
const reached = connectedNodes(starts, eventFlow.is, 'outgoing');
export const eventOverview = cleanSelection(unionSet(localModel, reached));
