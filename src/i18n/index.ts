/**
 * i18next 国际化配置
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from './locales/zh-CN.json';
import zhTW from './locales/zh-TW.json';
import en from './locales/en.json';
import ru from './locales/ru.json';
import { forkLocales } from './forkLocales';
import { mergeLocale } from './mergeLocale';
import vi from './locales/vi.json';
import ko from './locales/ko.json';
import { getInitialLanguage } from '@/utils/language';

i18n.use(initReactI18next).init({
  resources: {
    'zh-CN': { translation: mergeLocale(zhCN, forkLocales['zh-CN']) },
    'zh-TW': { translation: mergeLocale(zhTW, forkLocales['zh-TW']) },
    en: { translation: mergeLocale(en, forkLocales.en) },
    ru: { translation: mergeLocale(ru, forkLocales.ru) },
    vi: { translation: vi },
    ko: { translation: ko },
  },
  lng: getInitialLanguage(),
  fallbackLng: { vi: ['en', 'zh-CN'], ko: ['en', 'zh-CN'], default: ['zh-CN'] },
  interpolation: {
    escapeValue: false, // React 已经转义
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
