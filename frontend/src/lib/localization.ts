/**
 * Localization utilities for the LightSpeedPay platform
 * Supports multiple languages with fallback handling
 */

// Supported languages
export enum Language {
  EN = 'en', // English (default)
  HI = 'hi', // Hindi
  ES = 'es', // Spanish
  FR = 'fr', // French
  DE = 'de', // German
  ZH = 'zh', // Chinese
  JA = 'ja', // Japanese
}

// Language names for display
export const languageNames: Record<Language, string> = {
  [Language.EN]: 'English',
  [Language.HI]: 'हिन्दी',
  [Language.ES]: 'Español',
  [Language.FR]: 'Français',
  [Language.DE]: 'Deutsch',
  [Language.ZH]: '中文',
  [Language.JA]: '日本語',
};

// Define translation interfaces
export interface Translation {
  [key: string]: string | { [key: string]: string | Translation };
}

export interface Translations {
  [language: string]: Translation;
}

// Sample translations (to be expanded with actual content)
export const translations: Translations = {
  [Language.EN]: {
    common: {
      welcome: 'Welcome to LightSpeedPay',
      login: 'Login',
      register: 'Register',
      dashboard: 'Dashboard',
      transactions: 'Transactions',
      settings: 'Settings',
      logout: 'Logout',
    },
    auth: {
      emailLabel: 'Email Address',
      passwordLabel: 'Password',
      forgotPassword: 'Forgot password?',
      rememberMe: 'Remember me',
      signIn: 'Sign in',
      signUp: 'Sign up',
      createAccount: 'Create an account',
    },
    dashboard: {
      overview: 'Overview',
      recentTransactions: 'Recent Transactions',
      analytics: 'Analytics',
      totalRevenue: 'Total Revenue',
      successRate: 'Success Rate',
    },
    transactions: {
      id: 'ID',
      amount: 'Amount',
      status: 'Status',
      date: 'Date',
      gateway: 'Gateway',
      customer: 'Customer',
      viewDetails: 'View Details',
    },
    errors: {
      generalError: 'Something went wrong. Please try again.',
      notFound: 'Page not found',
      unauthorized: 'You are not authorized to access this resource',
      invalidCredentials: 'Invalid email or password',
    },
  },
  [Language.HI]: {
    common: {
      welcome: 'LightSpeedPay में आपका स्वागत है',
      login: 'लॉग इन',
      register: 'रजिस्टर',
      dashboard: 'डैशबोर्ड',
      transactions: 'लेनदेन',
      settings: 'सेटिंग्स',
      logout: 'लॉग आउट',
    },
    auth: {
      emailLabel: 'ईमेल पता',
      passwordLabel: 'पासवर्ड',
      forgotPassword: 'पासवर्ड भूल गए?',
      rememberMe: 'मुझे याद रखें',
      signIn: 'साइन इन',
      signUp: 'साइन अप',
      createAccount: 'खाता बनाएं',
    },
    dashboard: {
      overview: 'अवलोकन',
      recentTransactions: 'हाल के लेनदेन',
      analytics: 'एनालिटिक्स',
      totalRevenue: 'कुल राजस्व',
      successRate: 'सफलता दर',
    },
    transactions: {
      id: 'आईडी',
      amount: 'राशि',
      status: 'स्थिति',
      date: 'तारीख',
      gateway: 'गेटवे',
      customer: 'ग्राहक',
      viewDetails: 'विवरण देखें',
    },
    errors: {
      generalError: 'कुछ गलत हो गया। कृपया पुन: प्रयास करें।',
      notFound: 'पृष्ठ नहीं मिला',
      unauthorized: 'आपको इस संसाधन तक पहुंचने का अधिकार नहीं है',
      invalidCredentials: 'अमान्य ईमेल या पासवर्ड',
    },
  },
  // Additional languages would be added here
};

// Class for handling translations
export class LocalizationService {
  private currentLanguage: Language = Language.EN;
  private fallbackLanguage: Language = Language.EN;

  constructor(initialLanguage?: Language) {
    if (initialLanguage) {
      this.currentLanguage = initialLanguage;
    } else if (typeof window !== 'undefined') {
      // Try to detect browser language
      const browserLang = navigator.language.split('-')[0] as Language;
      if (Object.values(Language).includes(browserLang)) {
        this.currentLanguage = browserLang;
      }
      
      // Check for stored language preference
      const storedLang = localStorage.getItem('preferred-language') as Language;
      if (storedLang && Object.values(Language).includes(storedLang)) {
        this.currentLanguage = storedLang;
      }
    }
  }

  // Get current language
  public getLanguage(): Language {
    return this.currentLanguage;
  }

  // Set current language
  public setLanguage(language: Language): void {
    this.currentLanguage = language;
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-language', language);
      // Update HTML lang attribute
      document.documentElement.setAttribute('lang', language);
    }
  }

  // Get translation for a key
  public translate(key: string, params: Record<string, string> = {}): string {
    const path = key.split('.');
    
    // Get translation from current language or fallback
    const getNestedTranslation = (
      obj: Translation | undefined,
      path: string[]
    ): string => {
      if (!obj) return key; // Return key if translation object is undefined
      
      const current = path.shift();
      if (!current) return String(obj);
      
      const value = obj[current];
      if (!value) return key; // Key not found
      
      if (typeof value === 'string') {
        if (path.length === 0) {
          // Return string with parameters replaced
          return this.replaceParams(value, params);
        }
        return key; // More path components but reached a string value
      }
      
      return getNestedTranslation(value as Translation, path);
    };
    
    // Try to get translation from current language
    const result = getNestedTranslation(
      translations[this.currentLanguage],
      [...path] // Clone path array as it gets modified
    );
    
    // If key is returned, try fallback language
    if (result === key && this.currentLanguage !== this.fallbackLanguage) {
      const fallbackResult = getNestedTranslation(
        translations[this.fallbackLanguage],
        [...path]
      );
      return fallbackResult;
    }
    
    return result;
  }

  // Replace parameters in a translation string
  private replaceParams(text: string, params: Record<string, string>): string {
    return Object.entries(params).reduce(
      (result, [key, value]) => result.replace(new RegExp(`{{${key}}}`, 'g'), value),
      text
    );
  }

  // Get all available languages
  public getAvailableLanguages(): Language[] {
    return Object.values(Language);
  }

  // Get language names for display
  public getLanguageNames(): Record<Language, string> {
    return languageNames;
  }
}

// Create and export default instance
export const localization = new LocalizationService();

// Export shorthand t function for convenience
export const t = (key: string, params?: Record<string, string>): string => {
  return localization.translate(key, params);
};

export default localization; 