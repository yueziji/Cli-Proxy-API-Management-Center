import { describe, expect, test } from 'bun:test';
import i18n from '../src/i18n';

const flattenLeaves = (value: unknown, prefix = ''): Record<string, string> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? { [prefix]: String(value ?? '') } : {};
  }

  return Object.entries(value).reduce<Record<string, string>>((leaves, [key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return { ...leaves, ...flattenLeaves(child, path) };
  }, {});
};

const interpolationTokens = (value: string): string[] => value.match(/\{\{[^}]+\}\}/g) ?? [];

describe('Vietnamese locale', () => {
  test('covers every current English key with matching interpolation tokens', async () => {
    const english = flattenLeaves(await Bun.file('src/i18n/locales/en.json').json());
    const vietnamese = flattenLeaves(await Bun.file('src/i18n/locales/vi.json').json());
    const missing = Object.keys(english).filter((key) => !(key in vietnamese));
    const mismatches = Object.keys(english)
      .filter((key) => key in vietnamese)
      .filter(
        (key) =>
          interpolationTokens(english[key]).sort().join('|') !==
          interpolationTokens(vietnamese[key]).sort().join('|')
      );

    expect(missing).toEqual([]);
    expect(mismatches).toEqual([]);
  });

  test('keeps Vietnamese labels and falls back to English for fork-specific features', () => {
    const translations = i18n.cloneInstance({ lng: 'vi' });
    expect(translations.t('nav.dashboard')).toBe('Bảng điều khiển');
    expect(translations.t('dashboard.current_config')).toBe('Current Configuration');
    expect(translations.t('config_editor.visual.sections.system.request_log')).toBe(
      'Request Logging'
    );
  });
});
