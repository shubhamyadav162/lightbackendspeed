import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';

// Accessibility settings types
export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReaderOptimized: boolean;
  dyslexiaFriendly: boolean;
}

// Default accessibility settings
const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  screenReaderOptimized: false,
  dyslexiaFriendly: false,
};

// Context type
interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  resetSettings: () => void;
}

// Create context
const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

// Provider props
interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [storedSettings, setStoredSettings] = useLocalStorage<AccessibilitySettings>(
    'accessibility-settings',
    defaultSettings
  );
  
  const [settings, setSettings] = useState<AccessibilitySettings>(storedSettings);

  // Apply settings to DOM
  useEffect(() => {
    // High contrast
    if (settings.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    // Large text
    if (settings.largeText) {
      document.documentElement.classList.add('large-text');
    } else {
      document.documentElement.classList.remove('large-text');
    }

    // Reduced motion
    if (settings.reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }

    // Screen reader optimized
    if (settings.screenReaderOptimized) {
      document.documentElement.classList.add('screen-reader-optimized');
    } else {
      document.documentElement.classList.remove('screen-reader-optimized');
    }

    // Dyslexia friendly
    if (settings.dyslexiaFriendly) {
      document.documentElement.classList.add('dyslexia-friendly');
    } else {
      document.documentElement.classList.remove('dyslexia-friendly');
    }

    // Persist settings
    setStoredSettings(settings);
  }, [settings, setStoredSettings]);

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <AccessibilityContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// Custom hook to use accessibility context
export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

export default AccessibilityProvider; 