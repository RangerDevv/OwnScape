import { createContext, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useColorScheme } from '@/hooks/use-color-scheme'

const STORAGE_KEY = 'ownscape_theme_preference'

export type ThemePreference = 'system' | 'light' | 'dark'

export interface AppThemeColors {
  background: string
  card: string
  text: string
  textSecondary: string
  border: string
  yellow: string
  pink: string
  red: string
  green: string
  gray: string
  grayLight: string
  avatarBg: string
  destructiveBg: string
  destructiveBorder: string
  loading: string
  overlay: string
}

const lightColors: AppThemeColors = {
  background: '#fffdf0',
  card: '#ffffff',
  text: '#000000',
  textSecondary: '#6b7280',
  border: '#000000',
  yellow: '#ffe600',
  pink: '#ff70a6',
  red: '#dc2626',
  green: '#22c55e',
  gray: '#e5e7eb',
  grayLight: '#f3f4f6',
  avatarBg: '#ffe600',
  destructiveBg: '#fee2e2',
  destructiveBorder: '#dc2626',
  loading: '#111827',
  overlay: 'rgba(0,0,0,0.5)',
}

const darkColors: AppThemeColors = {
  background: '#121212',
  card: '#1e1e1e',
  text: '#e5e5e5',
  textSecondary: '#9ca3af',
  border: '#555555',
  yellow: '#ffe600',
  pink: '#ff70a6',
  red: '#ff4444',
  green: '#4ade80',
  gray: '#3a3a3a',
  grayLight: '#2a2a2a',
  avatarBg: '#ffe600',
  destructiveBg: '#2a0a0a',
  destructiveBorder: '#ff4444',
  loading: '#e5e5e5',
  overlay: 'rgba(0,0,0,0.7)',
}

interface AppThemeContextValue {
  isDark: boolean
  themePreference: ThemePreference
  colors: AppThemeColors
  setThemePreference: (pref: ThemePreference) => Promise<void>
}

const AppThemeContext = createContext<AppThemeContextValue>({
  isDark: false,
  themePreference: 'system',
  colors: lightColors,
  setThemePreference: async () => {},
})

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme()
  const [themePreference, setThemePref] = useState<ThemePreference>('system')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val === 'light' || val === 'dark' || val === 'system') {
        setThemePref(val)
      }
      setLoaded(true)
    })
  }, [])

  const isDark = themePreference === 'dark' || (themePreference === 'system' && systemScheme === 'dark')
  const colors = isDark ? darkColors : lightColors

  const setThemePreference = async (pref: ThemePreference) => {
    setThemePref(pref)
    await AsyncStorage.setItem(STORAGE_KEY, pref)
  }

  if (!loaded) {
    return <>{children}</>
  }

  return (
    <AppThemeContext.Provider value={{ isDark, themePreference, colors, setThemePreference }}>
      {children}
    </AppThemeContext.Provider>
  )
}

export function useAppTheme() {
  return useContext(AppThemeContext)
}
