import { useSettingsStore } from '../stores/settingsStore';
import { translations, type TranslationKey } from '../i18n/translations';

export const useTranslation = () => {
  const uiLanguage = useSettingsStore(state => state.uiLanguage);
  
  const t = (key: TranslationKey): string => {
    const activeTranslations = translations[uiLanguage] as Partial<Record<TranslationKey, string>>;
    return activeTranslations[key] || translations.en[key] || key;
  };
  
  return { t, currentLanguage: uiLanguage };
};
