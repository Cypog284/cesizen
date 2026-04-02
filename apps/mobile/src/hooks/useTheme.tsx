import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'cesizen_theme';

export const lightColors = {
  bg: '#f8fffe',
  card: '#ffffff',
  text: '#1a1a2e',
  textMuted: '#7f8c8d',
  border: '#e0e0e0',
  green: '#2d6a4f',
  greenPale: '#e8f5e9',
  tabBg: '#ffffff',
  tabBorder: '#e8f5e9',
  inputBg: '#ffffff',
  sectionBg: '#f5f5f5',
  danger: '#e74c3c',
};

export const darkColors = {
  bg: '#0d1f17',
  card: '#162820',
  text: '#e2f0e8',
  textMuted: '#7aaf90',
  border: '#1e3d2f',
  green: '#52b788',
  greenPale: '#152a1e',
  tabBg: '#0d1f17',
  tabBorder: '#1e3d2f',
  inputBg: '#1e3d2f',
  sectionBg: '#152a1e',
  danger: '#e05252',
};

export type ThemeColors = typeof lightColors;
type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: lightColors,
  isDark: false,
  mode: 'system',
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY).then(v => {
      if (v === 'light' || v === 'dark' || v === 'system') setModeState(v as ThemeMode);
    });
  }, []);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    SecureStore.setItemAsync(STORAGE_KEY, m);
  };

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ colors, isDark, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
