import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import siTranslations from './locales/si.json';
import taTranslations from './locales/ta.json';

// Detect initial language based on priority:
// 1. LocalStorage
// 2. Default to 'en'
const savedLang = localStorage.getItem('preferredLanguage') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      si: { translation: siTranslations },
      ta: { translation: taTranslations }
    },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values from XSS
    }
  });

export default i18n;
