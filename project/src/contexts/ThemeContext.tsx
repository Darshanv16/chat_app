import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme } from '../lib/supabase';
import { getTheme, ThemeConfig } from '../lib/themes';

type ThemeContextType = {
  theme: Theme;
  themeConfig: ThemeConfig;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('blue');
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(getTheme('blue'));

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setThemeState(savedTheme);
      setThemeConfig(getTheme(savedTheme));
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    setThemeConfig(getTheme(newTheme));
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, themeConfig, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
