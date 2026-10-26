/**
 * CSV formula injection protection (used by ExceLikeTable#exportCSV)
 */
import SecurityUtils from '../../../src/security-utils.js';

describe('SecurityUtils.escapeCSVFormula', () => {
  test.each([['=1+1'], ['+SUM(A1)'], ['-2+3'], ['@cmd'], ['\tTAB'], ['\rCR']])('escapes %j with a leading quote', (value) => {
    expect(SecurityUtils.escapeCSVFormula(value)).toBe(`'${value}`);
  });

  test.each([['-5'], ['+3.25'], ['-0.5'], ['-.5'], ['1e3'], ['-1E-3'], ['42']])('keeps the plain number %j unchanged', (value) => {
    expect(SecurityUtils.escapeCSVFormula(value)).toBe(value);
  });

  test('keeps ordinary text, and formula characters in the middle', () => {
    expect(SecurityUtils.escapeCSVFormula('Tokyo')).toBe('Tokyo');
    expect(SecurityUtils.escapeCSVFormula('a=b')).toBe('a=b');
  });

  test('returns empty string for null, undefined and empty input; non-strings unchanged', () => {
    expect(SecurityUtils.escapeCSVFormula(null)).toBe('');
    expect(SecurityUtils.escapeCSVFormula(undefined)).toBe('');
    expect(SecurityUtils.escapeCSVFormula('')).toBe('');
    expect(SecurityUtils.escapeCSVFormula(7)).toBe(7);
  });
});
