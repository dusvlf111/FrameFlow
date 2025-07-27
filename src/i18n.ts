import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 번역 파일 임포트
import enTranslation from '../public/locales/en/translation.json';
import koTranslation from '../public/locales/ko/translation.json';

i18n
  .use(LanguageDetector) // 브라우저 언어를 감지
  .use(initReactI18next) // react-i18next 초기화
  .init({
    resources: {
      en: {
        translation: enTranslation,
      },
      ko: {
        translation: koTranslation,
      },
    },
    fallbackLng: 'en', // 기본 언어
    debug: true, // 개발 중 디버그 로그 활성화
    interpolation: {
      escapeValue: false, // React는 XSS를 이미 방지하므로 이스케이프 비활성화
    },
  });

export default i18n;
