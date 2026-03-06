import { useEffect } from 'react';
import { Appearance, Platform } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useThemeStore } from '../store/theme.store';

if (Platform.OS === 'android') {
  const originalSetColorScheme = Appearance.setColorScheme;
  if (originalSetColorScheme) {
    Appearance.setColorScheme = (scheme) => {
      if (!scheme) {
        originalSetColorScheme('unspecified');
        return;
      }
      originalSetColorScheme(scheme);
    };
  }
}

export function ThemeController() {
  const { setColorScheme } = useColorScheme();
  const themeMode = useThemeStore((state) => state.themeMode);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldBeDark = themeMode === 'dark' || (themeMode === 'system' && isSystemDark);

      if (shouldBeDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    } else {
      setColorScheme(themeMode);
    }
  }, [themeMode, setColorScheme]);

  useEffect(() => {
    if (themeMode !== 'system') return;

    if (Platform.OS === 'web') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) => {
        if (e.matches) {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        } else {
          document.documentElement.classList.add('light');
          document.documentElement.classList.remove('dark');
        }
      };

      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      const sub = Appearance.addChangeListener(({ colorScheme }) => {
        setColorScheme(colorScheme === 'dark' ? 'dark' : 'light');
      });
      return () => sub.remove();
    }
  }, [themeMode, setColorScheme]);

  return null;
}
