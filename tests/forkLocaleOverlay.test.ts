import { describe, expect, test } from 'bun:test';
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
});
