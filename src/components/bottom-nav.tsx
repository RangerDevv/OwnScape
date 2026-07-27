import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Tab = 'feed' | 'explore' | 'create' | 'profile'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'feed', label: 'Home', icon: '🏠' },
  { key: 'explore', label: 'Explore', icon: '🔍' },
  { key: 'create', label: 'Post', icon: '➕' },
  { key: 'profile', label: 'Profile', icon: '👤' },
]

export default function BottomNav({ active }: { active: Tab }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const handlePress = (tab: Tab) => {
    if (tab === active) return
    const routes: Record<Tab, string> = {
      feed: '/feed',
      explore: '/explore',
      create: '/create',
      profile: '/profile',
    }
    router.push(routes[tab])
  }

  return (
    <View style={[styles.bottomNav, { bottom: Math.max(insets.bottom, 12) }]}>
      {TABS.map((tab) => {
        const isActive = tab.key === active
        return (
          <Pressable
            key={tab.key}
            style={isActive ? styles.navItemActive : styles.navItem}
            onPress={() => handlePress(tab.key)}
          >
            <Text style={isActive ? styles.navIconActiveSymbol : styles.navIconSymbol}>
              {tab.icon}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute', left: 20, right: 20, height: 60,
    backgroundColor: '#ffe600', borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 12,
    shadowColor: '#000', shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6,
    borderWidth: 3, borderColor: '#000',
  },
  navItem: {
    width: 42, height: 42, backgroundColor: '#ffffff', borderRadius: 8,
    borderWidth: 2, borderColor: '#000', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 2,
  },
  navItemActive: {
    width: 46, height: 46, backgroundColor: '#000', borderRadius: 8,
    borderWidth: 2, borderColor: '#000', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  navIconSymbol: { fontSize: 18 },
  navIconActiveSymbol: { fontSize: 18, color: '#ffffff' },
})
