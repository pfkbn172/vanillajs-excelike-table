/**
 * Language Switching Tests
 * Tests for i18n (internationalization) functionality
 */

import { describe, test, expect, beforeEach } from '@jest/globals';

describe('I18n - Language Switching', () => {
  let I18nModule;

  beforeEach(async () => {
    const module = await import('../../../src/i18n.js');
    I18nModule = module.default;
  });

  describe('Initialization', () => {
    test('should initialize with default locale (en)', () => {
      const i18n = Object.create(I18nModule);
      i18n.init();

      expect(i18n.getLocale()).toBe('en');
    });

    test('should initialize with specified locale', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({ locale: 'ja' });

      expect(i18n.getLocale()).toBe('ja');
    });

    test('should have fallback locale', () => {
      const i18n = Object.create(I18nModule);
      i18n.init();

      expect(i18n.fallbackLocale).toBe('en');
    });

    test('should load default messages', () => {
      const i18n = Object.create(I18nModule);
      i18n.init();

      expect(i18n.messages.size).toBeGreaterThan(0);
      expect(i18n.messages.has('en')).toBe(true);
      expect(i18n.messages.has('ja')).toBe(true);
    });
  });

  describe('Locale Management', () => {
    test('should switch locale from English to Japanese', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({ locale: 'en' });

      const result = i18n.setLocale('ja');

      expect(result).toBe(true);
      expect(i18n.getLocale()).toBe('ja');
    });

    test('should switch locale from Japanese to English', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({ locale: 'ja' });

      const result = i18n.setLocale('en');

      expect(result).toBe(true);
      expect(i18n.getLocale()).toBe('en');
    });

    test('should return false for unsupported locale', () => {
      const i18n = Object.create(I18nModule);
      i18n.init();

      const result = i18n.setLocale('unknown');

      expect(result).toBe(false);
      expect(i18n.getLocale()).toBe('en'); // Should keep current locale
    });

    test('should get available locales', () => {
      const i18n = Object.create(I18nModule);
      i18n.init();

      const locales = i18n.getAvailableLocales();

      expect(Array.isArray(locales)).toBe(true);
      expect(locales).toContain('en');
      expect(locales).toContain('ja');
    });
  });

  describe('Translation - English', () => {
    test('should translate table.loading in English', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({ locale: 'en' });

      const translation = i18n.t('table.loading');

      expect(translation).toBe('Loading...');
    });

    test('should translate table.empty in English', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({ locale: 'en' });

      const translation = i18n.t('table.empty');

      expect(translation).toBe('No data');
    });

    test('should translate pagination.previous in English', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({ locale: 'en' });

      const translation = i18n.t('pagination.previous');

      expect(translation).toBe('Previous page');
    });

    test('should translate pagination.next in English', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({ locale: 'en' });

      const translation = i18n.t('pagination.next');

      expect(translation).toBe('Next page');
    });

    test('should translate filter.placeholder in English', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({ locale: 'en' });

      const translation = i18n.t('filter.placeholder');

      expect(translation).toBe('Search...');
    });
  });

  describe('Translation - Japanese', () => {
    test('should translate table.loading in Japanese', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({ locale: 'ja' });

      const translation = i18n.t('table.loading');

      expect(translation).toBe('読み込み中...');
    });

    test('should translate table.empty in Japanese', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({ locale: 'ja' });

      const translation = i18n.t('table.empty');

      expect(translation).toBe('データがありません');
    });

    test('should translate pagination.previous in Japanese', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({ locale: 'ja' });

      const translation = i18n.t('pagination.previous');

      expect(translation).toBe('前のページ');
    });

    test('should translate pagination.next in Japanese', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({ locale: 'ja' });

      const translation = i18n.t('pagination.next');

      expect(translation).toBe('次のページ');
    });

    test('should translate filter.placeholder in Japanese', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({ locale: 'ja' });

      const translation = i18n.t('filter.placeholder');

      expect(translation).toBe('検索...');
    });
  });

  describe('Interpolation', () => {
    test('should interpolate parameters in English', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({ locale: 'en' });

      const translation = i18n.t('pagination.page', { page: 5 });

      expect(translation).toBe('Page 5');
    });

    test('should interpolate parameters in Japanese', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({ locale: 'ja' });

      const translation = i18n.t('pagination.page', { page: 5 });

      expect(translation).toBe('ページ5');
    });

    test('should interpolate multiple parameters', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({ locale: 'en' });

      const translation = i18n.t('pagination.total', {
        start: 1,
        end: 10,
        total: 100
      });

      expect(translation).toBe('1-10 of 100 items');
    });

    test('should handle missing parameters gracefully', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({ locale: 'en' });

      const translation = i18n.t('pagination.page');

      expect(translation).toContain('{page}'); // Should keep placeholder
    });
  });

  describe('Fallback Behavior', () => {
    test('should fallback to English for missing translation', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({ locale: 'ja' });

      // Try to get a key that might not exist in Japanese
      const translation = i18n.t('nonexistent.key');

      // Should return the key itself as fallback
      expect(translation).toBe('nonexistent.key');
    });

    test('should warn about missing translations', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({ locale: 'en' });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      i18n.t('missing.translation');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Custom Messages', () => {
    test('should add custom messages', () => {
      const i18n = Object.create(I18nModule);
      i18n.init();

      i18n.addMessages('en', {
        'custom.message': 'Custom Message'
      });

      const translation = i18n.t('custom.message');

      expect(translation).toBe('Custom Message');
    });

    test('should override existing messages', () => {
      const i18n = Object.create(I18nModule);
      i18n.init();

      i18n.addMessages('en', {
        'table.loading': 'Please wait...'
      });

      const translation = i18n.t('table.loading');

      expect(translation).toBe('Please wait...');
    });

    test('should initialize with custom messages', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({
        locale: 'en',
        messages: {
          'app.title': 'My Application'
        }
      });

      const translation = i18n.t('app.title');

      expect(translation).toBe('My Application');
    });
  });

  describe('Date Formatting', () => {
    test('should format date in English locale', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({ locale: 'en' });

      const date = new Date('2024-01-15');
      const formatted = i18n.formatDate(date);

      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    test('should format date in Japanese locale', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({ locale: 'ja' });

      const date = new Date('2024-01-15');
      const formatted = i18n.formatDate(date);

      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    test('should format relative time', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({ locale: 'en' });

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const formatted = i18n.formatDate(fiveMinutesAgo, { relative: true });

      expect(formatted).toContain('5');
      expect(formatted).toContain('minutes');
    });

    test('should handle invalid dates', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({ locale: 'en' });

      const formatted = i18n.formatDate('invalid-date');

      expect(formatted).toBe('');
    });
  });

  describe('Number Formatting', () => {
    test('should format numbers in English locale', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({ locale: 'en' });

      const formatted = i18n.formatNumber(1234567.89);

      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    test('should format numbers in Japanese locale', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({ locale: 'ja' });

      const formatted = i18n.formatNumber(1234567.89);

      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    test('should format currency in USD', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({ locale: 'en' });

      const formatted = i18n.formatNumber(1234.56, {
        style: 'currency',
        currency: 'USD'
      });

      expect(formatted).toContain('$');
      expect(formatted).toContain('1,234.56');
    });

    test('should format currency in JPY', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({ locale: 'ja' });

      const formatted = i18n.formatNumber(1234, {
        style: 'currency',
        currency: 'JPY'
      });

      // Accept both ¥ (U+00A5) and ￥ (U+FFE5) yen signs
      const hasYenSign = formatted.includes('¥') || formatted.includes('￥');
      expect(hasYenSign).toBe(true);
      expect(formatted).toContain('1,234');
    });

    test('should format percentages', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({ locale: 'en' });

      const formatted = i18n.formatNumber(0.7525, { style: 'percent' });

      expect(formatted).toContain('%');
    });

    test('should handle invalid numbers', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({ locale: 'en' });

      const formatted = i18n.formatNumber('not-a-number');

      expect(formatted).toBe('');
    });
  });

  describe('RTL Support', () => {
    test('should detect RTL languages', () => {
      const i18n = Object.create(I18nModule);
      i18n.init();

      expect(i18n.isRTL('ar')).toBe(true);
      expect(i18n.isRTL('he')).toBe(true);
      expect(i18n.isRTL('fa')).toBe(true);
    });

    test('should detect LTR languages', () => {
      const i18n = Object.create(I18nModule);
      i18n.init();

      expect(i18n.isRTL('en')).toBe(false);
      expect(i18n.isRTL('ja')).toBe(false);
      expect(i18n.isRTL('es')).toBe(false);
    });
  });

  describe('Export/Import', () => {
    test('should export locale data', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({ locale: 'en' });

      const exported = i18n.exportLocale('en');

      expect(typeof exported).toBe('object');
      expect(exported['table.loading']).toBe('Loading...');
    });

    test('should export current locale by default', () => {
      const i18n = Object.create(I18nModule);
      i18n.init({ locale: 'ja' });

      const exported = i18n.exportLocale();

      expect(exported['table.loading']).toBe('読み込み中...');
    });

    test('should return empty object for non-existent locale', () => {
      const i18n = Object.create(I18nModule);
      i18n.init();

      const exported = i18n.exportLocale('nonexistent');

      expect(exported).toEqual({});
    });
  });
});
