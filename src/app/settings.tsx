import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay, withTiming } from 'react-native-reanimated'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '@/lib/supabase'
import { handleError } from '@/lib/errors'
import { uploadAvatar } from '@/lib/storage'
import { useAppTheme, PRESET_PALETTES, type CustomPalette, type ThemePreference } from '@/hooks/use-app-theme'
import ColorPicker from '@/components/color-picker'
import UserAvatar from '@/components/user-avatar'
import type { DbUser } from '@/lib/database.types'

const THEME_OPTIONS: { key: ThemePreference; label: string }[] = [
  { key: 'system', label: 'SYSTEM' },
  { key: 'light', label: 'LIGHT' },
  { key: 'dark', label: 'DARK' },
]

function AnimatedSection({ children, delay }: { children: React.ReactNode; delay: number }) {
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(24)

  useEffect(() => {
    opacity.value = withDelay(delay, withSpring(1, { damping: 16, stiffness: 100 }))
    translateY.value = withDelay(delay, withSpring(0, { damping: 16, stiffness: 100 }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  return <Animated.View style={style}>{children}</Animated.View>
}

export default function SettingsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { colors, isDark, themePreference, customPalette, setThemePreference, setCustomPalette } = useAppTheme()

  const [profile, setProfile] = useState<DbUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [editName, setEditName] = useState('')
  const [editHandle, setEditHandle] = useState('')
  const [editBio, setEditBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [palettePrimary, setPalettePrimary] = useState(customPalette?.primary || '#ffe600')
  const [paletteSecondary, setPaletteSecondary] = useState(customPalette?.secondary || '#ff70a6')

  useEffect(() => {
    if (customPalette) {
      setPalettePrimary(customPalette.primary)
      setPaletteSecondary(customPalette.secondary)
    }
  }, [customPalette])

  const themeAnimProgress = useSharedValue(0)
  const prevIsDark = useRef(isDark)

  useEffect(() => {
    if (prevIsDark.current !== isDark) {
      themeAnimProgress.value = 0
      themeAnimProgress.value = withTiming(1, { duration: 400 })
      prevIsDark.current = isDark
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDark])

  useEffect(() => {
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        let { data } = await supabase
          .from('Users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (data) {
          setProfile(data)
          setEditName(data.user_name || '')
          setEditHandle(data.user_handle || '')
          setEditBio(data.user_bio || '')
        }
      } catch (e) {
        handleError(e, 'fetchProfile')
      }
      setLoading(false)
    })()
  }, [])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('Users')
        .update({
          user_name: editName.trim() || null,
          user_handle: editHandle.trim(),
          user_bio: editBio.trim() || null,
        })
        .eq('id', profile.id)

      if (!error) {
        setProfile(prev => prev ? {
          ...prev,
          user_name: editName.trim() || null,
          user_handle: editHandle.trim(),
          user_bio: editBio.trim() || null,
        } : prev)
      }
    } catch (e) {
      handleError(e, 'handleSave')
    }
    setSaving(false)
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await supabase.auth.signOut()
      router.replace('/')
    } catch (e) {
      handleError(e, 'handleSignOut')
    }
    setIsSigningOut(false)
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your profile, posts, and comments. This cannot be undone.',
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'DELETE EVERYTHING',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            try {
              await supabase.from('Comments').delete().eq('author_id', user.id)
              await supabase.from('Posts').delete().eq('author_id', user.id)
              await supabase.from('Users').delete().eq('id', user.id)
              await supabase.auth.signOut()
            } catch (e) {
              handleError(e, 'handleDeleteAccount')
            }
            setDeleting(false)
            router.replace('/')
          },
        },
      ]
    )
  }

  const previewColors = isDark
    ? { bg: '#1e1e1e', text: '#e5e5e5', subtext: '#9ca3af', border: '#555555' }
    : { bg: '#ffffff', text: '#000000', subtext: '#6b7280', border: '#000000' }

  const previewAnimStyle = useAnimatedStyle(() => ({
    opacity: 0.6 + themeAnimProgress.value * 0.4,
    transform: [{ scale: 0.95 + themeAnimProgress.value * 0.05 }],
  }))

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.loading} />
      </View>
    )
  }

  return (
    <View style={[styles.page, { backgroundColor: colors.background, paddingTop: insets.top + 16 }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.grayLight, borderColor: colors.border }]}
        >
          <Text style={[styles.backBtnText, { color: colors.text }]}>← BACK</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>SETTINGS</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── PROFILE SECTION ── */}
        <AnimatedSection delay={50}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>👤 PROFILE</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable
              onPress={async () => {
                const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
                if (!permission.granted) {
                  Alert.alert('Permission needed', 'Camera roll permission is required to pick an avatar.')
                  return
                }
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ['images'],
                  allowsMultipleSelection: false,
                  quality: 0.7,
                })
                if (result.canceled || !result.assets?.length) return
                const asset = result.assets[0]
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return
                const url = await uploadAvatar(asset, user.id)
                if (url) {
                  await supabase.from('Users').update({ avatar_url: url }).eq('id', user.id)
                  setProfile(prev => prev ? { ...prev, avatar_url: url } : prev)
                }
              }}
            >
              <UserAvatar
                avatarUrl={profile?.avatar_url}
                name={profile?.user_name}
                handle={profile?.user_handle}
                size={72}
                borderColor={colors.border}
                style={styles.avatarShadow}
              />
            </Pressable>

            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Display Name"
              placeholderTextColor={colors.textSecondary}
            />
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              value={editHandle}
              onChangeText={setEditHandle}
              placeholder="Username"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, styles.bioInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Bio"
              placeholderTextColor={colors.textSecondary}
              multiline
            />

            <Pressable
              style={[styles.saveBtn, { borderColor: colors.border }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? 'SAVING...' : '💾 SAVE'}</Text>
            </Pressable>
          </View>
        </AnimatedSection>

        {/* ── THEME SECTION ── */}
        <AnimatedSection delay={150}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>🎨 THEME</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.themeToggleRow}>
              {THEME_OPTIONS.map((opt) => {
                const active = themePreference === opt.key
                return (
                  <Pressable
                    key={opt.key}
                    style={[
                      styles.themeToggle,
                      { borderColor: colors.border, backgroundColor: colors.grayLight },
                      active && { backgroundColor: '#000' },
                    ]}
                    onPress={() => setThemePreference(opt.key)}
                  >
                    <Animated.Text style={[
                      styles.themeToggleText,
                      { color: colors.text },
                      active && { color: '#fff', fontWeight: '900' },
                    ]}>
                      {opt.label}
                    </Animated.Text>
                  </Pressable>
                )
              })}
            </View>

            <Animated.View style={[
              styles.previewCard,
              {
                backgroundColor: previewColors.bg,
                borderColor: previewColors.border,
              },
              previewAnimStyle,
            ]}>
              <View style={styles.previewRow}>
                <View style={[styles.previewAvatar, { backgroundColor: colors.yellow, borderColor: previewColors.border }]}>
                  <Text style={styles.previewAvatarText}>{(profile?.user_name || 'U').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.previewInfo}>
                  <View style={[styles.previewNameBar, { backgroundColor: previewColors.text }]} />
                  <View style={[styles.previewHandleBar, { backgroundColor: previewColors.subtext }]} />
                </View>
              </View>
              <View style={[styles.previewBody, { backgroundColor: previewColors.subtext }]} />
              <View style={[styles.previewActionBar, { backgroundColor: colors.pink }]}>
                <Text style={styles.previewStar}>⭐</Text>
                <Text style={styles.previewStar}>💬</Text>
                <Text style={styles.previewStar}>✈️</Text>
              </View>
            </Animated.View>
            <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
              {isDark ? 'DARK MODE' : 'LIGHT MODE'}
            </Text>
          </View>
        </AnimatedSection>

        {/* ── PALETTE SECTION ── */}
        <AnimatedSection delay={250}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>🎨 CUSTOM PALETTE</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ColorPicker
              label="PRIMARY ACCENT"
              value={palettePrimary}
              options={PRESET_PALETTES.map(p => p.primary)}
              onChange={(c) => {
                setPalettePrimary(c)
                setCustomPalette({ primary: c, secondary: paletteSecondary })
              }}
            />
            <ColorPicker
              label="SECONDARY ACCENT"
              value={paletteSecondary}
              options={PRESET_PALETTES.map(p => p.secondary)}
              onChange={(c) => {
                setPaletteSecondary(c)
                setCustomPalette({ primary: palettePrimary, secondary: c })
              }}
            />

            <View style={styles.presetRow}>
              {PRESET_PALETTES.map((p) => {
                const isActive =
                  p.primary.toUpperCase() === palettePrimary.toUpperCase() &&
                  p.secondary.toUpperCase() === paletteSecondary.toUpperCase()
                return (
                  <Pressable
                    key={p.name}
                    style={[
                      styles.presetChip,
                      {
                        borderColor: isActive ? colors.text : colors.border,
                        backgroundColor: colors.grayLight,
                      },
                    ]}
                    onPress={() => {
                      setPalettePrimary(p.primary)
                      setPaletteSecondary(p.secondary)
                      setCustomPalette({ primary: p.primary, secondary: p.secondary })
                    }}
                  >
                    <View style={styles.presetColors}>
                      <View style={[styles.presetDot, { backgroundColor: p.primary }]} />
                      <View style={[styles.presetDot, { backgroundColor: p.secondary }]} />
                    </View>
                    <Text style={[styles.presetName, { color: colors.text }]}>{p.name}</Text>
                  </Pressable>
                )
              })}
            </View>

            <Pressable
              style={[styles.resetPaletteBtn, { borderColor: colors.border, backgroundColor: colors.grayLight }]}
              onPress={async () => {
                setPalettePrimary('#ffe600')
                setPaletteSecondary('#ff70a6')
                await setCustomPalette(null)
              }}
            >
              <Text style={[styles.resetPaletteBtnText, { color: colors.text }]}>↺ RESET TO DEFAULTS</Text>
            </Pressable>
          </View>
        </AnimatedSection>

        {/* ── ACCOUNT SECTION ── */}
        <AnimatedSection delay={350}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>🔒 ACCOUNT</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable
              style={[styles.signOutBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
              onPress={handleSignOut}
              disabled={isSigningOut}
            >
              <Text style={[styles.signOutBtnText, { color: colors.text }]}>
                {isSigningOut ? 'SIGNING OUT...' : 'SIGN OUT'}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.deleteAccountBtn, { borderColor: colors.destructiveBorder, backgroundColor: colors.destructiveBg }]}
              onPress={handleDeleteAccount}
              disabled={deleting}
            >
              <Text style={[styles.deleteAccountBtnText, { color: colors.red }]}>
                {deleting ? 'DELETING...' : 'DELETE ACCOUNT'}
              </Text>
            </Pressable>
          </View>
        </AnimatedSection>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  page: { flex: 1, paddingHorizontal: 16 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: 14, borderBottomWidth: 3, marginBottom: 20,
  },
  backBtn: {
    paddingVertical: 6, paddingHorizontal: 10,
    borderWidth: 2, borderRadius: 6,
  },
  backBtnText: { fontSize: 12, fontWeight: '900' },
  headerTitle: { fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  scrollContent: { paddingBottom: 40 },
  sectionLabel: { fontSize: 16, fontWeight: '900', marginBottom: 12, letterSpacing: 0.5 },
  card: {
    borderRadius: 12, padding: 20, marginBottom: 28,
    borderWidth: 3, alignItems: 'center',
    boxShadow: '5px 5px 0px #000', elevation: 5,
  },
  avatarShadow: {
    marginBottom: 16,
    boxShadow: '3px 3px 0px #000',
  },
  input: {
    width: '100%', borderWidth: 2, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, marginTop: 10,
    fontSize: 14, fontWeight: '600',
  },
  bioInput: { height: 80, textAlignVertical: 'top' },
  saveBtn: {
    marginTop: 20, width: '100%', backgroundColor: '#22c55e', borderRadius: 8,
    paddingVertical: 14, alignItems: 'center', borderWidth: 2,
    boxShadow: '3px 3px 0px #000', elevation: 3,
  },
  saveBtnText: { color: '#000', fontSize: 14, fontWeight: '900' },

  // Theme
  themeToggleRow: { flexDirection: 'row', gap: 8, width: '100%', marginBottom: 20 },
  themeToggle: {
    flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8,
    borderWidth: 2,
    boxShadow: '2px 2px 0px #000', elevation: 2,
  },
  themeToggleText: { fontSize: 12, fontWeight: '800' },
  previewCard: {
    width: '100%', borderRadius: 10, padding: 14, borderWidth: 2.5, marginBottom: 10,
  },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  previewAvatar: {
    width: 36, height: 36, borderRadius: 6, backgroundColor: '#ffe600',
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  previewAvatarText: { fontSize: 14, fontWeight: '900', color: '#000' },
  previewInfo: { flex: 1, gap: 6 },
  previewNameBar: { height: 10, width: '60%', borderRadius: 2, opacity: 0.8 },
  previewHandleBar: { height: 7, width: '40%', borderRadius: 2, opacity: 0.5 },
  previewBody: { height: 60, borderRadius: 6, marginBottom: 12, opacity: 0.2 },
  previewActionBar: {
    flexDirection: 'row', gap: 8, borderRadius: 6, padding: 8,
  },
  previewStar: { fontSize: 12 },
  previewLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },

  // Palette
  presetRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    width: '100%', marginBottom: 16,
  },
  presetChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6, paddingHorizontal: 10,
    borderRadius: 8, borderWidth: 2,
  },
  presetColors: { flexDirection: 'row', gap: 3 },
  presetDot: { width: 14, height: 14, borderRadius: 4 },
  presetName: { fontSize: 11, fontWeight: '800' },
  resetPaletteBtn: {
    width: '100%', borderWidth: 2,
    borderRadius: 8, paddingVertical: 10, alignItems: 'center',
  },
  resetPaletteBtnText: { fontSize: 12, fontWeight: '900' },

  // Account
  signOutBtn: {
    width: '100%', borderWidth: 2,
    borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginBottom: 12,
  },
  signOutBtnText: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  deleteAccountBtn: {
    width: '100%', borderWidth: 2, borderRadius: 8, paddingVertical: 14, alignItems: 'center',
  },
  deleteAccountBtnText: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
})
