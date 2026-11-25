export const UNKNOWN_MODEL_TYPE = 'unknown';

/** Escape controls without silently truncating authored values or interpreting ANSI. */
export function plain(value: string): string {
  return value.replace(/[\x00-\x1f\x7f-\x9f]/g, c => JSON.stringify(c).slice(1, -1).replace(c, `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`));
}
