import { useEffect, useState } from 'react'
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { getFollowers, getFollowing } from '@/lib/follows'
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
  const [users, setUsers] = useState<DbUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!visible) return
    setLoading(true)
    ;(async () => {
      const data = listType === 'followers' ? await getFollowers(userId) : await getFollowing(userId)
      setUsers(data)
      setLoading(false)
    })()
  }, [userId, listType, visible])

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouch} onPress={onClose} />
        <View style={styles.container}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {listType === 'followers' ? 'FOLLOWERS' : 'FOLLOWING'}
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#111827" />
            </View>
          ) : users.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>
                {listType === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.listArea} contentContainerStyle={styles.listContent}>
              {users.map(u => (
                <Pressable
                  key={u.id}
                  style={styles.userCard}
                  onPress={() => { onClose(); router.push(`/profile/${u.id}`) }}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarLetter}>
                      {(u.user_name || u.user_handle || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{u.user_name || 'Unnamed'}</Text>
                    <Text style={styles.userHandle}>@{u.user_handle}</Text>
                    {u.user_bio && <Text style={styles.userBio} numberOfLines={1}>{u.user_bio}</Text>}
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
    flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backdropTouch: { flex: 1 },
  container: {
    backgroundColor: '#fffdf0', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderTopWidth: 3, borderLeftWidth: 3, borderRightWidth: 3, borderColor: '#000',
    maxHeight: '75%', minHeight: 200,
  },
  handle: {
    width: 40, height: 4, backgroundColor: '#d1d5db', borderRadius: 2,
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: '#000',
  },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#000', letterSpacing: 0.5 },
  closeBtn: {
    position: 'absolute', right: 12,
    width: 30, height: 30, borderRadius: 6, backgroundColor: '#e5e7eb',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#000',
  },
  closeBtnText: { fontSize: 12, fontWeight: '900', color: '#000' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyWrap: { padding: 40, alignItems: 'center' },
  emptyText: { fontWeight: '900', fontSize: 16, color: '#9ca3af' },
  listArea: { flex: 1 },
  listContent: { padding: 16, gap: 10 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#ffffff', borderRadius: 8, padding: 14,
    borderWidth: 2, borderColor: '#000',
    shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 2,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 6, backgroundColor: '#ffe600',
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#000',
  },
  avatarLetter: { fontSize: 18, fontWeight: '900', color: '#000' },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '900', color: '#000' },
  userHandle: { fontSize: 11, fontWeight: '700', color: '#6b7280' },
  userBio: { fontSize: 11, fontWeight: '500', color: '#4b5563', marginTop: 2 },
})
