/**
 * i18next 国际化配置
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from './locales/zh-CN.json';
import zhTW from './locales/zh-TW.json';
import en from './locales/en.json';
import ru from './locales/ru.json';
import vi from './locales/vi.json';
import ko from './locales/ko.json';
import { getInitialLanguage } from '@/utils/language';
import { withForkResources, FORK_FALLBACK_LANGUAGES } from './forkLocales';

i18n.use(initReactI18next).init({
  resources: withForkResources({
    'zh-CN': { translation: zhCN },
    'zh-TW': { translation: zhTW },
    en: { translation: en },
    ru: { translation: ru },
    vi: { translation: vi },
    ko: { translation: ko },
  }),
  lng: getInitialLanguage(),
  fallbackLng: FORK_FALLBACK_LANGUAGES,
  interpolation: {
    escapeValue: false, // React 已经转义
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
