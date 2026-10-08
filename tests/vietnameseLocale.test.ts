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

  test('does not reintroduce removed promotion entries through locale resources', async () => {
    const vietnamese = await Bun.file('src/i18n/locales/vi.json').json();
    for (const path of [
      'nav.quick_start',
      'nav_meta.quick_start',
      'auth_login.kimi_sign_up_button',
      'auth_login.recommended_provider_section',
      'config_management.visual.sections.network.proxy_url_sponsor_hint',
      'providersPage.sponsor',
      'providersPage.categories.quickFill',
    ]) {
      expect(vietnamese).not.toHaveProperty(path);
    }
    for (const provider of [
      'apikeyFun',
      'fennoAI',
      'qiniuCloud',
      'code0',
      'claudeApi',
      'lmuAI',
      'infistar',
      'kimi',
    ]) {
      expect(vietnamese.providersPage.providerNames).not.toHaveProperty(provider);
    }
  });
});
