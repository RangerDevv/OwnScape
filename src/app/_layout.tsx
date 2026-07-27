import { Stack, usePathname, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

const isWeb = Platform.OS === 'web'

export default function RootLayout() {
  const router = useRouter()
  const pathname = usePathname()
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setIsLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
    })
    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (isLoading) return
    const isAuthScreen = pathname === '/' || pathname === '/signup'
    if (!session && !isAuthScreen) { router.replace('/'); return }
    if (session && isAuthScreen) { router.replace('/feed') }
  }, [isLoading, pathname, router, session])

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    )
  }

  return (
    <View style={styles.outer}>
      <View style={styles.inner}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fffdf0',
  },
  outer: {
    flex: 1, backgroundColor: '#fffdf0',
    ...(isWeb ? { alignItems: 'center' } : {}),
  },
  inner: {
    flex: 1, width: '100%',
    ...(isWeb ? { maxWidth: 480, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#e5e7eb' } : {}),
  },
})
