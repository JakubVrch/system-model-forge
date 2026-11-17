import { definePartition } from '@core';
import { topics } from './elements.ts';
import { topic } from './_metamodel/topic-node.ts';

export const partition = definePartition({
  id: 'topics', name: 'Topics', elements: { topics }, metamodel: { topic },
});
export type { TopicNode } from './_metamodel/topic-node.ts';
