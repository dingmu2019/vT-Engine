
import { useSettings } from '../contexts';
import { locales } from '../locales';
import { useCallback } from 'react';

/**
 * Custom hook for i18n translation
 * Usage: 
 * const { t } = useTranslation();
 * <span>{t('common.save')}</span>
 */
export const useTranslation = () => {
  const { language } = useSettings();

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    const keys = key.split('.');
    let value: any = locales[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k as keyof typeof value];
      } else {
        // Fallback to English if key missing in current lang
        if (language !== 'en') {
           let fallbackValue: any = locales['en'];
           for (const fk of keys) {
             if (fallbackValue && typeof fallbackValue === 'object' && fk in fallbackValue) {
               fallbackValue = fallbackValue[fk as keyof typeof fallbackValue];
             } else {
               return key; // Not found in fallback either
             }
           }
           value = fallbackValue;
        } else {
           return key; // Not found
        }
      }
    }

    if (typeof value !== 'string') return key;

    // Replace params: "Hello {name}" -> "Hello World"
    if (params) {
      return value.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
    }

    return value;
  }, [language]);

  return { t, language };
};
