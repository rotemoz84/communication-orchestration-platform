import { content } from '../translations/texts';

type Language = 'he';

export const useTranslation = () => {
  const language: Language = 'he'; // Currently only Hebrew is supported

  const t = (key: string): any => {
    const keys = key.split('.');
    let value: any = content;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    if (value !== undefined) {
      // If the translation is a string with language structure, extract the Hebrew text
      if (typeof value === 'object' && value.he) {
        return value.he;
      }
      return value;
    }
    
    // Return the key if translation not found
    console.warn(`Translation not found for key: ${key}`);
    return key;
  };

  const tWithParams = (key: string, params: Record<string, string | number | React.ReactNode> = {}): string => {
    let translation = t(key);
    
    // If the translation is a string with language structure, extract the Hebrew text
    if (typeof translation === 'object' && translation.he) {
      translation = translation.he;
    }
    
    // Replace parameters in the translation string
    Object.entries(params).forEach(([param, value]) => {
      const stringValue = typeof value === 'string' || typeof value === 'number' ? String(value) : '';
      translation = translation.replace(new RegExp(`{${param}}`, 'g'), stringValue);
    });
    
    return translation;
  };

  return {
    t,
    tWithParams,
    language
  };
};

export default useTranslation;
