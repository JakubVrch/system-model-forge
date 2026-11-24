import { definePartition } from 'governed-model-core';
export const partition = definePartition({ id: 'root', name: 'Root', diagrams: {
 overview: { data: new Set(), inNotation: ' root exact\n', fileExtension: '.mmd' },
 deployment: { data: new Set(), inNotation: '@startuml\n@enduml\n', fileExtension: '.puml' },
} });
