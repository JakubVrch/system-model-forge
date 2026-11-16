import { describe, expect, it } from 'vitest';

import * as api from '@core';

describe('public surface', () => {
  it('exports only the documented runtime members', () => {
    expect(Object.keys(api).sort()).toEqual([
      'Edge',
      'ModelElement',
      'Node',
      'cleanSelection',
      'connectedNodes',
      'defineElement',
      'exportDiagram',
      'filterSet',
      'readonlySet',
      'saveDiagram',
      'unionSet',
    ].sort());
  });
});
