import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeSkin = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeSkin;
  isDark: boolean;
  setTheme: (theme: ThemeSkin) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeSkin>(() => {
    try {
      const saved = localStorage.getItem('smartclass_theme_skin');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {
      console.error(e);
    }
    return 'dark'; // Default Dark Navy & Cyan
  });

  useEffect(() => {
    try {
      localStorage.setItem('smartclass_theme_skin', theme);
    } catch (e) {
      console.error(e);
    }

    const root = document.documentElement;
    const body = document.body;

    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      body.classList.add('dark');
      body.classList.remove('light');
      body.style.backgroundColor = '#020f1c';
      body.style.color = '#f1f5f9';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      body.classList.remove('dark');
      body.classList.add('light');
      body.style.backgroundColor = '#f8fafc';
      body.style.color = '#0f172a';
    }
  }, [theme]);

  const setTheme = (t: ThemeSkin) => {
    setThemeState(t);
  };

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
