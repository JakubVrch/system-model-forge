import { topic } from './_metamodel/topic-node.ts';
import { readonlySet } from '@core';

const sharedTopic = topic('shared', 'Shared topic');
const topicA = topic('topicA', 'Topic A');
const topicB = topic('topicB', 'Topic B');
const unrelatedTopic = topic('unrelated', 'Unrelated topic');

export const topics = readonlySet([sharedTopic, topicA, topicB, unrelatedTopic]);
