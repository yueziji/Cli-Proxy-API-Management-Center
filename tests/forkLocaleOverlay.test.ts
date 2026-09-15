import { describe, expect, test } from 'bun:test';
import { createInstance } from 'i18next';
import { forkLocales } from '../src/i18n/forkLocales';
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

  test('provides the same fork-owned namespaces for every locale', () => {
    for (const locale of Object.values(forkLocales)) {
      expect(locale.dashboard.current_config).toBeTruthy();
      expect(locale.auth_files.refresh_interval_label).toBeTruthy();
      expect(locale.config_editor.visual.sections.system.request_log).toBeTruthy();
      expect(locale.providersPage.detail.fields.disableCooling).toBeTruthy();
    }
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
