import { useEffect, useState } from 'react'
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { getFollowers, getFollowing } from '@/lib/follows'
import { handleError } from '@/lib/errors'
import { useAppTheme } from '@/hooks/use-app-theme'
import UserAvatar from '@/components/user-avatar'
import type { DbUser } from '@/lib/database.types'

type ListType = 'followers' | 'following'

type Props = {
  userId: string
  listType: ListType
  visible: boolean
  onClose: () => void
}

export default function FollowListModal({ userId, listType, visible, onClose }: Props) {
  const router = useRouter()
  const { colors } = useAppTheme()
  const [users, setUsers] = useState<DbUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!visible) return
    setLoading(true)
    ;(async () => {
      try {
        const data = listType === 'followers' ? await getFollowers(userId) : await getFollowing(userId)
        setUsers(data)
      } catch (e) {
        handleError(e, 'loadFollowList')
      }
      setLoading(false)
    })()
  }, [userId, listType, visible])

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <Pressable style={styles.backdropTouch} onPress={onClose} />
        <View style={[styles.container, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={[styles.handle, { backgroundColor: colors.gray }]} />
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {listType === 'followers' ? 'FOLLOWERS' : 'FOLLOWING'}
            </Text>
            <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.gray, borderColor: colors.border }]}>
              <Text style={[styles.closeBtnText, { color: colors.text }]}>✕</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.loading} />
            </View>
          ) : users.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {listType === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.listArea} contentContainerStyle={styles.listContent}>
              {users.map(u => (
                <Pressable
                  key={u.id}
                  style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => { onClose(); router.push(`/profile/${u.id}`) }}
                >
                  <UserAvatar
                    avatarUrl={u.avatar_url}
                    name={u.user_name}
                    handle={u.user_handle}
                    size={44}
                    borderColor={colors.border}
                  />
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: colors.text }]}>{u.user_name || 'Unnamed'}</Text>
                    <Text style={[styles.userHandle, { color: colors.textSecondary }]}>@{u.user_handle}</Text>
                    {u.user_bio && <Text style={[styles.userBio, { color: colors.textSecondary }]} numberOfLines={1}>{u.user_bio}</Text>}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, justifyContent: 'flex-end',
  },
  backdropTouch: { flex: 1 },
  container: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderTopWidth: 3, borderLeftWidth: 3, borderRightWidth: 3,
    maxHeight: '75%', minHeight: 200,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 2,
  },
  headerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  closeBtn: {
    position: 'absolute', right: 12,
    width: 30, height: 30, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
  },
  closeBtnText: { fontSize: 12, fontWeight: '900' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyWrap: { padding: 40, alignItems: 'center' },
  emptyText: { fontWeight: '900', fontSize: 16 },
  listArea: { flex: 1 },
  listContent: { padding: 16, gap: 10 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 8, padding: 14,
    borderWidth: 2,
    boxShadow: '2px 2px 0px #000', elevation: 2,
  },

  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '900' },
  userHandle: { fontSize: 11, fontWeight: '700' },
  userBio: { fontSize: 11, fontWeight: '500', marginTop: 2 },
})
