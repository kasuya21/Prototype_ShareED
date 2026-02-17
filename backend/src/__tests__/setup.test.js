import { describe, test, expect } from '@jest/globals';
import fc from 'fast-check';

describe('Test Setup', () => {
  test('Jest is working correctly', () => {
    expect(true).toBe(true);
  });

  test('fast-check is working correctly', () => {
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return n === n;
      })
    );
  });
});
