import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { readJson, writeJson } from '../lib/storage.js';

const KEY = 'bn_theme_v1';

export const THEMES = [
  { id: 'soothing', label: 'Soothing', description: 'Warm tape-deck paper' },
  { id: 'light', label: 'Light', description: 'Crisp paper' },
  { id: 'dark', label: 'Dark', description: 'Deep navy night' },
];
const THEME_IDS = THEMES.map((t) => t.id);
const META_COLORS = { soothing: '#ede8dd', light: '#f5f2eb', dark: '#051424' };

const ThemeContext = createContext(null);

function readInitialTheme() {
  const fromDom = document.documentElement.getAttribute('data-theme');
  if (THEME_IDS.includes(fromDom)) return fromDom; // set by /theme-init.js before paint
  const saved = readJson(KEY, null);
  return THEME_IDS.includes(saved) ? saved : 'soothing';
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLORS[theme]);
    writeJson(KEY, theme);
  }, [theme]);

  const setTheme = useCallback((id) => {
    if (THEME_IDS.includes(id)) setThemeState(id);
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeState((current) => THEME_IDS[(THEME_IDS.indexOf(current) + 1) % THEME_IDS.length]);
  }, []);

  const value = useMemo(() => ({ theme, themes: THEMES, setTheme, cycleTheme }), [theme, setTheme, cycleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
