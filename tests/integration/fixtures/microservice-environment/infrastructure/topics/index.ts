import { topic } from '@metamodel';
import { readonlySet } from '@core';

export const sharedTopic = topic('shared', 'Shared topic');
export const topicA = topic('topicA', 'Topic A');
export const topicB = topic('topicB', 'Topic B');
export const unrelatedTopic = topic('unrelated', 'Unrelated topic');
export const topics = readonlySet([sharedTopic, topicA, topicB, unrelatedTopic]);
