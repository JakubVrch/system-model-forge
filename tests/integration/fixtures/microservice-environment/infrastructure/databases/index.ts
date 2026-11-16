import { database } from '@metamodel';
import { readonlySet } from '@core';

export const databaseA = database('databaseA', 'Database A');
export const databaseB = database('databaseB', 'Database B');
export const databases = readonlySet([databaseA, databaseB]);
