import { describe, expect, test } from 'bun:test';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { OAuthPage } from '@/pages/OAuthPage';
import { codexToResource, vertexToResource } from '@/features/providers/adapters';
import { BaseProviderForm } from '@/features/providers/sheets/forms/BaseProviderForm';
import { OpenAIConnectivityTest } from '@/features/providers/sheets/forms/OpenAIConnectivityTest';
import type { ConnectivityState } from '@/features/providers/sheets/forms/useConnectivityTest';
import { forkLocales } from '@/i18n/forkLocales';
import { mergeLocale } from '@/i18n/mergeLocale';
import en from '@/i18n/locales/en.json';

const i18n = createInstance();
await i18n.init({
  lng: 'en',
  fallbackLng: false,
  resources: { en: { translation: mergeLocale(en, forkLocales.en) } },
});

const render = (element: ReactElement) =>
  renderToStaticMarkup(
    createElement(I18nextProvider, { i18n }, createElement(MemoryRouter, null, element))
  );

const renderForm = (baseUrl: string, brand: 'codex' | 'vertex' = 'codex', mutating = false) => {
  const config = { apiKey: 'fixture-key', baseUrl, disableCooling: true };
  return render(
    createElement(BaseProviderForm, {
      brand,
      resource: brand === 'codex' ? codexToResource(config, 0) : vertexToResource(config, 0),
      mode: 'edit',
      mutating,
      formId: 'fixture-form',
      onSubmit: async () => {},
    })
  );
};

describe('fork provider UI', () => {
  test('keeps the OAuth provider order, Kimi login and Devin guidance', () => {
    const markup = render(createElement(OAuthPage));
    const providers = ['codex', 'anthropic', 'antigravity', 'kimi', 'xai', 'devin'];
    let previous = -1;
    for (const provider of providers) {
      const position = markup.indexOf(i18n.t(`auth_login.${provider}_oauth_title`));
      expect(position).toBeGreaterThan(previous);
      previous = position;
    }
    expect(markup.indexOf(i18n.t('vertex_import.title'))).toBeGreaterThan(previous);
    expect(markup).toContain('Start Kimi Login');
    expect(markup).toContain('v7.3.1');
    expect(markup).not.toContain('Sign Up Now');
  });

  test('shows a hard URL error on the input while preserving the configured cooling control', () => {
    const markup = renderForm('ftp://example.com', 'codex', true);
    expect(markup).toContain('Base URL must start with http:// or https://');
    expect(markup).toMatch(/<input[^>]*id="[^"]*-baseUrl"[^>]*aria-invalid="true"/);
    const coolingLabel = [...markup.matchAll(/<label\b[^>]*>[\s\S]*?<\/label>/g)].find(([label]) =>
      label.includes('Disable cooling')
    )?.[0];
    expect(coolingLabel).toContain('checked=""');
    expect(coolingLabel).toContain('disabled=""');
  });

  test('shows a soft URL warning without marking the input invalid', () => {
    const markup = renderForm('https://api.example.com/v1?route=stable');
    expect(markup).toContain('Base URL contains a query string');
    expect(markup).not.toMatch(/<input[^>]*id="[^"]*-baseUrl"[^>]*aria-invalid/);
  });

  test('keeps Vertex free of unsupported cooling controls', () => {
    expect(renderForm('', 'vertex')).not.toContain('Disable cooling');
  });
});

describe('OpenAI batch connectivity summary', () => {
  const entries = [
    { apiKey: '', existingApiKey: 'fixture-saved-key', proxyUrl: '' },
    { apiKey: '', authIndex: 'fixture-auth-index', proxyUrl: '' },
  ];
  const renderSummary = (states: ConnectivityState[], disabled = false) =>
    render(
      createElement(OpenAIConnectivityTest, {
        entries,
        statuses: states.map((state) => ({ state, message: '' })),
        disabled,
        onTest: async () => {},
      })
    );
  const success = i18n.t('providersPage.connectivity.success');

  test('counts saved credentials and auth-index entries before declaring success', () => {
    expect(renderSummary(['success', 'idle'])).not.toContain(success);
    expect(renderSummary(['success', 'success'])).toContain(success);
  });

  test('does not show success while a request is pending or failed', () => {
    expect(renderSummary(['success', 'error'])).not.toContain(success);
    const pending = renderSummary(['success', 'loading'], true);
    expect(pending).not.toContain(success);
    expect(pending).toMatch(/<button[^>]*disabled=""/);
  });
});
