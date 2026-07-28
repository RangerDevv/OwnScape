import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { useAppTheme } from '@/hooks/use-app-theme'

function Shimmer({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useAppTheme()
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [opacity])

  return (
    <Animated.View
      style={[
        { backgroundColor: colors.gray, borderRadius: 6, opacity },
        style,
      ]}
    />
  )
}

export function PostCardSkeleton() {
  const { colors } = useAppTheme()
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.authorRow}>
        <Shimmer style={styles.avatar} />
        <View style={styles.authorText}>
          <Shimmer style={styles.nameBar} />
          <Shimmer style={[styles.nameBar, { width: '40%', marginTop: 4 }]} />
        </View>
      </View>
      <Shimmer style={styles.imagePlaceholder} />
      <View style={[styles.actionBar, { backgroundColor: colors.pink, borderColor: colors.border }]}>
        <Shimmer style={styles.actionBtn} />
        <Shimmer style={styles.actionBtn} />
        <Shimmer style={styles.actionBtn} />
      </View>
    </View>
  )
}

export function ProfileCardSkeleton() {
  return (
    <View style={{ padding: 16 }}>
      <Shimmer style={{ width: 72, height: 72, borderRadius: 12, alignSelf: 'center', marginBottom: 16 }} />
      <Shimmer style={{ width: '50%', height: 18, borderRadius: 4, alignSelf: 'center', marginBottom: 8 }} />
      <Shimmer style={{ width: '30%', height: 14, borderRadius: 4, alignSelf: 'center', marginBottom: 12 }} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Shimmer style={{ flex: 1, height: 60, borderRadius: 8 }} />
        <Shimmer style={{ flex: 1, height: 60, borderRadius: 8 }} />
      </View>
    </View>
  )
}

export function CommentSkeleton() {
  return (
    <View style={{ padding: 16 }}>
      <Shimmer style={{ width: '100%', height: 60, borderRadius: 8, marginBottom: 12 }} />
      <Shimmer style={{ width: '100%', height: 60, borderRadius: 8, marginBottom: 12 }} />
      <Shimmer style={{ width: '60%', height: 60, borderRadius: 8 }} />
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16, marginTop: 20, borderRadius: 12, padding: 16,
    borderWidth: 3,
    boxShadow: '5px 5px 0px #000', elevation: 5,
  },
  authorRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 8,
  },
  authorText: { marginLeft: 10, flex: 1 },
  nameBar: { width: '60%', height: 12, borderRadius: 4 },
  imagePlaceholder: { width: '100%', height: 200, borderRadius: 6, marginBottom: 12 },
  actionBar: {
    flexDirection: 'row', gap: 8, borderRadius: 8, padding: 8,
    borderWidth: 3,
  },
  actionBtn: { flex: 1, height: 32, borderRadius: 6 },
})
