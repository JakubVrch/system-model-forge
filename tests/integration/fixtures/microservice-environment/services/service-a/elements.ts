import { findById, readonlySet } from 'governed-model-core';
import { partition as services } from '../services.partition.ts';
import { partition as topics } from '../../topics/topics.partition.ts';
import { partition as databases } from '../../databases/databases.partition.ts';

const { service: createService, module, moduleComposition, eventFlow, databaseUsage } = services.metamodel;
const sharedTopic = findById(topics.elements.topics, 'shared');
const topicA = findById(topics.elements.topics, 'topicA');
const databaseA = findById(databases.elements.databases, 'databaseA');

const service = createService('serviceA', 'Service A');
const moduleA1 = module('moduleA1', 'Module A1');
const moduleA2 = module('moduleA2', 'Module A2');


export const localModel = readonlySet([
    service,
    moduleA1,
    moduleA2,
    moduleComposition(service, moduleA1, 'service-a-contains-module-1'),
    moduleComposition(service, moduleA2, 'service-a-contains-module-2'),
    eventFlow(service, sharedTopic, 'service-a-publishes-shared', 'publish'),
    eventFlow(service, sharedTopic, 'service-a-subscribes-shared', 'subscribe'),
    eventFlow(service, topicA, 'service-a-publishes-topic', 'publish'),
    databaseUsage(service, databaseA, 'service-a-uses-database')
])


