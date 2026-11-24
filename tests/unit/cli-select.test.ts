import { expect, it } from 'vitest';
import { definePartition, Node } from '@core';
import { selectCandidates, parentIdentity, validatePartition } from '@cli/source/select';
import type { LoadedCandidate } from '@cli/result';
const candidate = (id: string, name: string, path: string, parentPath: string | null = null): LoadedCandidate => ({ entry: { path, absolutePath: `/root/${path}`, parentPath }, partition: definePartition({ id, name }) });
const values = [candidate('a', 'same', 'a.partition.ts'), candidate('b', 'same', 'child/b.partition.ts', 'a.partition.ts'), candidate('c', 'other', 'z.partition.ts')];
it('unions within kinds, intersects across kinds and never expands parents', () => {
 expect(selectCandidates(values, ['a', 'c', 'a'], ['same']).map(x => x.partition.id)).toEqual(['a']);
 expect(selectCandidates(values, [], ['same'])).toHaveLength(2);
 expect(selectCandidates(values, ['a'], [])).toHaveLength(1);
 expect(selectCandidates([], [], [])).toEqual([]);
});
it('requires every selector value to match before intersection and validates unique candidate IDs', () => {
 expect(() => selectCandidates(values, ['a', 'missing'], [])).toThrow(/match/);
 expect(() => selectCandidates(values, ['a'], ['other'])).toThrow(/intersection/);
 expect(() => selectCandidates([...values, candidate('a', 'again', 'd.partition.ts')], ['b'], [])).toThrow(/Duplicate/);
});
it('enriches parent identity only from loaded candidates', () => {
 expect(parentIdentity(values[1]!, values)).toEqual({ path: 'a.partition.ts', id: 'a', name: 'same' });
 expect(parentIdentity(values[1]!, [values[1]!])).toEqual({ path: 'a.partition.ts' });
});
it('validates public groups but allows distinct elements with duplicate IDs', () => {
 expect(() => validatePartition({ id: 'a', name: 'A' }, 'a.partition.ts')).toThrow();
 expect(() => validatePartition(definePartition({ id: 'a', name: 'A', elements: { items: new Set([new Node('same'), new Node('same')]) } }), 'a.partition.ts')).not.toThrow();
});
