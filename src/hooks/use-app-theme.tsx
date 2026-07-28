import { createContext, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useColorScheme } from '@/hooks/use-color-scheme'

const STORAGE_KEY = 'ownscape_theme_preference'
const PALETTE_KEY = 'ownscape_custom_palette'

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

export interface CustomPalette {
  primary: string
  secondary: string
}

export const PRESET_PALETTES: { name: string; primary: string; secondary: string }[] = [
  { name: 'Classic', primary: '#ffe600', secondary: '#ff70a6' },
  { name: 'Ocean', primary: '#3b82f6', secondary: '#06b6d4' },
  { name: 'Forest', primary: '#22c55e', secondary: '#84cc16' },
  { name: 'Sunset', primary: '#f97316', secondary: '#a855f7' },
  { name: 'Rose', primary: '#ec4899', secondary: '#f43f5e' },
  { name: 'Night', primary: '#6366f1', secondary: '#8b5cf6' },
]

function applyPalette(base: AppThemeColors, palette: CustomPalette | null): AppThemeColors {
  if (!palette) return base
  return {
    ...base,
    yellow: palette.primary,
    pink: palette.secondary,
    avatarBg: palette.primary,
  }
}

interface AppThemeContextValue {
  isDark: boolean
  themePreference: ThemePreference
  colors: AppThemeColors
  customPalette: CustomPalette | null
  setThemePreference: (pref: ThemePreference) => Promise<void>
  setCustomPalette: (palette: CustomPalette | null) => Promise<void>
}

const AppThemeContext = createContext<AppThemeContextValue>({
  isDark: false,
  themePreference: 'system',
  colors: lightColors,
  customPalette: null,
  setThemePreference: async () => {},
  setCustomPalette: async () => {},
})

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme()
  const [themePreference, setThemePref] = useState<ThemePreference>('system')
  const [customPalette, setCustomPaletteState] = useState<CustomPalette | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(PALETTE_KEY),
    ]).then(([themeVal, paletteVal]) => {
      if (themeVal === 'light' || themeVal === 'dark' || themeVal === 'system') {
        setThemePref(themeVal)
      }
      if (paletteVal) {
        try {
          const parsed = JSON.parse(paletteVal)
          if (parsed.primary && parsed.secondary) {
            setCustomPaletteState(parsed)
          }
        } catch {}
      }
      setLoaded(true)
    })
  }, [])

  const isDark = themePreference === 'dark' || (themePreference === 'system' && systemScheme === 'dark')
  const baseColors = isDark ? darkColors : lightColors
  const colors = applyPalette(baseColors, customPalette)

  const setThemePreference = async (pref: ThemePreference) => {
    setThemePref(pref)
    await AsyncStorage.setItem(STORAGE_KEY, pref)
  }

  const setCustomPalette = async (palette: CustomPalette | null) => {
    setCustomPaletteState(palette)
    if (palette) {
      await AsyncStorage.setItem(PALETTE_KEY, JSON.stringify(palette))
    } else {
      await AsyncStorage.removeItem(PALETTE_KEY)
    }
  }

  if (!loaded) {
    return <>{children}</>
  }

  return (
    <AppThemeContext.Provider value={{ isDark, themePreference, colors, customPalette, setThemePreference, setCustomPalette }}>
      {children}
    </AppThemeContext.Provider>
  )
}

export function useAppTheme() {
  return useContext(AppThemeContext)
}
