import { describe, expect, test } from 'bun:test';
import { createInstance } from 'i18next';
import { forkLocales, withForkResources, FORK_FALLBACK_LANGUAGES } from '../src/i18n/forkLocales';
import { mergeLocale } from '../src/i18n/mergeLocale';

describe('fork locale overlay', () => {
  test('deep-merges local fields without replacing sibling upstream fields', () => {
    const merged = mergeLocale(
      {
        dashboard: { upstream_title: 'Upstream', current_config: 'Old' },
        auth_files: { prefix_label: 'Prefix' },
      },
      forkLocales.en
    );

    expect(merged).toMatchObject({
      dashboard: {
        upstream_title: 'Upstream',
        current_config: 'Current Configuration',
      },
      auth_files: {
        prefix_label: 'Prefix',
        refresh_interval_label: 'Refresh Interval (refresh_interval)',
      },
      providersPage: {
        table: { disableCoolingTag: 'No cooling' },
      },
    });
  });

  test('provides complete namespaces for the fully translated fork locales', () => {
    for (const language of ['zh-CN', 'zh-TW', 'en', 'ru'] as const) {
      const locale = forkLocales[language];
      expect(locale.dashboard.current_config).toBeTruthy();
      expect(locale.auth_files.refresh_interval_label).toBeTruthy();
      expect(locale.config_editor.visual.sections.system.request_log).toBeTruthy();
      expect(locale.providersPage.detail.fields.disableCooling).toBeTruthy();
    }
  });

  test('keeps group-name translations outside upstream JSON for all supported locales', async () => {
    for (const language of Object.keys(forkLocales) as (keyof typeof forkLocales)[]) {
      const base = await Bun.file(`src/i18n/locales/${language}.json`).json();
      expect(base.providersPage.form).not.toHaveProperty('groupNameHint');
      const translations = createInstance();
      await translations.init({
        lng: language,
        fallbackLng: FORK_FALLBACK_LANGUAGES,
        resources: withForkResources({ [language]: { translation: base } }),
      });
      expect(translations.t('providersPage.form.groupNameHint')).toBe(
        forkLocales[language].providersPage.form.groupNameHint
      );
      expect(translations.t('nav.dashboard')).toBe(base.nav.dashboard);
    }
  });

  test('preserves extra namespaces and new upstream languages without mutating base resources', () => {
    const base = {
      en: { translation: { dashboard: { current_config: 'Base' } }, extra: { label: 'Extra' } },
      fr: { translation: { dashboard: { current_config: 'Configuration' } } },
    };
    const resources = withForkResources(base);
    expect(resources.en.extra).toEqual(base.en.extra);
    expect(resources.fr).toBe(base.fr);
    expect(base.en.translation.dashboard.current_config).toBe('Base');
    expect(resources.en.translation.dashboard.current_config).toBe('Current Configuration');
  });

  const translatedLabels = [
    ['en', 'On', 'Base URL is not a valid URL', 'Start Kimi Login', 'Request Logging'],
    ['zh-CN', '开', '服务地址不是合法的 URL', '开始 Kimi 登录', '请求日志'],
    ['zh-TW', '開', '服務位址不是合法的 URL', '開始 Kimi 登入', '請求記錄'],
    [
      'ru',
      'Вкл',
      'Base URL не является корректным URL',
      'Начать вход Kimi',
      'Журналирование запросов',
    ],
  ] as const;

  for (const [language, websocketOn, invalidUrl, kimiLogin, requestLog] of translatedLabels) {
    test(`${language}: resolves local UI labels alongside upstream OAuth labels without fallback`, async () => {
      const base = await Bun.file(`src/i18n/locales/${language}.json`).json();
      const i18n = createInstance();
      await i18n.init({
        lng: language,
        fallbackLng: false,
        resources: { [language]: { translation: mergeLocale(base, forkLocales[language]) } },
      });

      expect(i18n.t('auth_files.websockets_state_on')).toBe(websocketOn);
      expect(i18n.t('providersPage.form.validation.baseUrlInvalid')).toBe(invalidUrl);
      expect(i18n.t('auth_login.kimi_oauth_button')).toBe(kimiLogin);
      expect(i18n.t('config_management.visual.sections.system.request_log')).toBe(requestLog);
      expect(i18n.t('config_editor.visual.sections.system.request_log')).toBe(requestLog);
      expect(i18n.t('auth_login.devin_oauth_button')).toBe(base.auth_login.devin_oauth_button);
      expect(i18n.exists('auth_login.kimi_sign_up_button')).toBe(false);
    });
  }
});
