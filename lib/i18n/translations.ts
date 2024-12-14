import { Language } from './config';

const translations: { [key in Language]: any } = {
  en: require('./locales/en.json'),
  fr: require('./locales/fr.json'),
  ja: require('./locales/ja.json'),
  zh: require('./locales/zh.json'),
  ko: require('./locales/ko.json'),
  es: require('./locales/es.json'),
  pt: require('./locales/pt.json'),
};

export const getTranslations = (lang: Language) => {
  return translations[lang] || translations.en;
};

export const t = (lang: Language, key: string) => {
  const keys = key.split('.');
  let value = getTranslations(lang);
  
  for (const k of keys) {
    if (value?.[k]) {
      value = value[k];
    } else {
      return key;
    }
  }
  
  return value;
}; 