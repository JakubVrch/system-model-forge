import { CHILD_ERROR_KIND, type ChildResponse, type ChildResult } from '@cli/source/result';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function hasStrings(value: Record<string, unknown>, keys: string[]): boolean {
  return keys.every(key => typeof value[key] === 'string');
}

export function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

export function isModelType(value: unknown): boolean {
  return value === null || typeof value === 'string';
}

export function isPartitionIdentity(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && hasStrings(value, ['id', 'name', 'path']);
}

export type ChildFailure = Extract<ChildResponse, { kind: typeof CHILD_ERROR_KIND }>;

export type ResponseValidator<Result extends ChildResult> = (value: unknown) => value is Result;

function isFailureResponse(value: unknown): value is ChildFailure {
  return isRecord(value) && value.kind === CHILD_ERROR_KIND
    && isRecord(value.error) && typeof value.error.message === 'string' && isRecord(value.error.context)
    && Object.values(value.error.context).every(entry => typeof entry === 'string');
}

export function validResponse<Result extends ChildResult>(
  value: unknown, validate: ResponseValidator<Result>,
): value is Result | ChildFailure {
  return isFailureResponse(value) || validate(value);
}
