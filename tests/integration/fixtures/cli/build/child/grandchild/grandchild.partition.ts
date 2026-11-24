import { definePartition } from 'governed-model-core';
export const partition = definePartition({ id: 'grandchild', name: 'Grandchild', diagrams: {
 overview: { data: new Set(), inNotation: '', fileExtension: '.mmd' },
 details: { data: new Set(), inNotation: 'Unicode Žluťoučký\n', fileExtension: '.txt' },
} });
