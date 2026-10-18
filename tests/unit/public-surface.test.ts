import { describe, expect, it } from 'vitest';

import * as api from '../../src/index.js';

describe('public surface', () => {
  it('exports only the documented runtime members', () => {
    expect(Object.keys(api).sort()).toEqual(['Edge', 'ModelElement', 'Node', 'exportDiagram', 'saveDiagram'].sort());
  });
});
