import { definePartition } from 'governed-model-core';
export const partition = definePartition({ id: 'child', name: 'Child', diagrams: {
 view: { data: new Set(), inNotation: 'earlier', fileExtension: '.diagram.txt' },
 'view.diagram': { data: new Set(), inNotation: 'collision winner\n', fileExtension: '.txt' },
} });
