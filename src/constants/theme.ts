/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

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

export const LightColors: AppThemeColors = {
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

export const DarkColors: AppThemeColors = {
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
