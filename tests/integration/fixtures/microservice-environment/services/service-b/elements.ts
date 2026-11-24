import { findById, readonlySet } from 'governed-model-core';
import { partition as services } from '../services.partition.ts';
import { partition as topics } from '../../topics/topics.partition.ts';
import { partition as databases } from '../../databases/databases.partition.ts';

const { service: createService, module, moduleComposition, eventFlow, databaseUsage } = services.metamodel;
const sharedTopic = findById(topics.elements.topics, 'shared');
const topicB = findById(topics.elements.topics, 'topicB');
const databaseB = findById(databases.elements.databases, 'databaseB');

const service = createService('serviceB', 'Service B');
const moduleB1 = module('moduleB1', 'Module B1');
const moduleB2 = module('moduleB2', 'Module B2');

export const localModel = readonlySet([
  service,
  moduleB1,
  moduleB2,
  moduleComposition(service, moduleB1, 'service-b-contains-module-1'),
  moduleComposition(service, moduleB2, 'service-b-contains-module-2'),
  eventFlow(service, sharedTopic, 'service-b-subscribes-shared', 'subscribe'),
  eventFlow(service, topicB, 'service-b-publishes-topic', 'publish'),
  databaseUsage(service, databaseB, 'service-b-uses-database'),
]);
