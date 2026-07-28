import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { fetchNotifications, markAsRead, subscribeToNotifications } from '@/lib/notifications'
import { useAppTheme } from '@/hooks/use-app-theme'
import UserAvatar from '@/components/user-avatar'
import type { DbNotification, DbUser } from '@/lib/database.types'

type NotificationWithActor = DbNotification & {
  actor: Pick<DbUser, 'user_name' | 'user_handle' | 'avatar_url'> | null
}

function notificationText(n: NotificationWithActor): string {
  const name = n.actor?.user_name || n.actor?.user_handle || 'Someone'
  switch (n.type) {
    case 'like': return `${name} liked your post`
    case 'comment': return `${name} commented on your post`
    case 'follow': return `${name} followed you`
    case 'mention': return `${name} mentioned you in a post`
    default: return 'New notification'
  }
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function InboxScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { colors } = useAppTheme()
  const [notifications, setNotifications] = useState<NotificationWithActor[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setCurrentUserId(user.id)

      const rows = await fetchNotifications(user.id)
      const actorIds = [...new Set(rows.map(r => r.actor_id))]
      let userMap: Record<string, { user_name: string | null; user_handle: string; avatar_url: string | null }> = {}
      if (actorIds.length > 0) {
        const { data: users } = await supabase
          .from('Users')
          .select('id, user_name, user_handle, avatar_url')
          .in('id', actorIds)
        if (users) {
          for (const u of users) {
            userMap[u.id] = { user_name: u.user_name, user_handle: u.user_handle, avatar_url: u.avatar_url }
          }
        }
      }
      setNotifications(rows.map(r => ({ ...r, actor: userMap[r.actor_id] || null })))

      const unreadIds = rows.filter(r => !r.read).map(r => r.id)
      if (unreadIds.length > 0) {
        await markAsRead(unreadIds)
      }

      setLoading(false)
    })()
  }, [])

  useEffect(() => {
    if (!currentUserId) return
    const unsub = subscribeToNotifications(currentUserId, async (notification) => {
      const { data: actorData } = await supabase
        .from('Users')
        .select('user_name, user_handle, avatar_url')
        .eq('id', notification.actor_id)
        .single()
      const n: NotificationWithActor = {
        ...notification,
        actor: actorData || null,
      }
      setNotifications(prev => [n, ...prev])
    })
    return unsub
  }, [currentUserId])

  return (
    <View style={[styles.page, { backgroundColor: colors.background, paddingTop: insets.top + 16 }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.grayLight, borderColor: colors.border }]}>
          <Text style={[styles.backBtnText, { color: colors.text }]}>← BACK</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>INBOX</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.loading} />
        </View>
      ) : notifications.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🔔</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No notifications yet</Text>
            <Text style={{ fontWeight: '600', color: colors.textSecondary, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
              When someone likes, comments, or follows you, it&apos;ll show up here
            </Text>
          </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {notifications.map(n => (
            <Pressable
              key={n.id}
              style={[styles.notifCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                if (n.type === 'follow') {
                  router.push(`/profile/${n.actor_id}`)
                } else if (n.post_id) {
                  router.push(`/post/${n.post_id}`)
                }
              }}
            >
              <UserAvatar
                avatarUrl={n.actor?.avatar_url}
                name={n.actor?.user_name}
                handle={n.actor?.user_handle}
                size={40}
                borderColor={colors.border}
              />
              <View style={styles.notifInfo}>
                <Text style={[styles.notifText, { color: colors.text }]}>
                  {notificationText(n)}
                </Text>
                <Text style={[styles.notifTime, { color: colors.textSecondary }]}>
                  {timeAgo(n.created_at)}
                </Text>
              </View>
              {!n.read && <View style={[styles.unreadDot, { backgroundColor: colors.pink }]} />}
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
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
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyText: { fontWeight: '900', fontSize: 16 },
  scrollContent: { paddingBottom: 40 },
  notifCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 10, padding: 14, marginBottom: 10,
    borderWidth: 2,
    boxShadow: '2px 2px 0px #000', elevation: 2,
  },
  notifInfo: { flex: 1 },
  notifText: { fontSize: 14, fontWeight: '700' },
  notifTime: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  unreadDot: {
    width: 10, height: 10, borderRadius: 5,
  },
})
