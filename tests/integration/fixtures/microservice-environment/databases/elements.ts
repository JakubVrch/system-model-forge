import { database } from './_metamodel/database-node.ts';
import { readonlySet } from '@core';

const databaseA = database('databaseA', 'Database A');
const databaseB = database('databaseB', 'Database B');

export const databases = readonlySet([databaseA, databaseB]);
