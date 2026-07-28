import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppTheme } from '@/hooks/use-app-theme'

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
  const { colors } = useAppTheme()

  const handlePress = (tab: Tab) => {
    if (tab === active) return
    const routes: Record<Tab, any> = {
      feed: '/feed',
      explore: '/explore',
      create: '/create',
      profile: '/profile',
    }
    router.push(routes[tab])
  }

  return (
    <View style={[styles.bottomNav, { bottom: Math.max(insets.bottom, 12), backgroundColor: colors.yellow, borderColor: colors.border }]}>
      {TABS.map((tab) => {
        const isActive = tab.key === active
        return (
          <Pressable
            key={tab.key}
            style={[
              isActive ? styles.navItemActive : styles.navItem,
              {
                backgroundColor: isActive ? colors.text : colors.card,
                borderColor: colors.border,
              },
            ]}
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
    borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 12,
    boxShadow: '5px 5px 0px #000', elevation: 6,
    borderWidth: 3,
  },
  navItem: {
    width: 42, height: 42, borderRadius: 8,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    boxShadow: '2px 2px 0px #000', elevation: 2,
  },
  navItemActive: {
    width: 46, height: 46, borderRadius: 8,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    boxShadow: '2px 2px 0px #000', elevation: 3,
  },
  navIconSymbol: { fontSize: 18 },
  navIconActiveSymbol: { fontSize: 18, color: '#ffffff' },
})
