import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { deleteStorageImages, parseUrls } from '@/lib/storage'
import { getFollowCounts } from '@/lib/follows'
import { handleError } from '@/lib/errors'
import { useAppTheme } from '@/hooks/use-app-theme'
import BottomNav from '@/components/bottom-nav'
import FollowListModal from '@/components/follow-list-modal'
import UserAvatar from '@/components/user-avatar'
import type { DbPost, DbUser } from '@/lib/database.types'

export default function ProfileScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { colors } = useAppTheme()
  const [profile, setProfile] = useState<DbUser | null>(null)
  const [myPosts, setMyPosts] = useState<DbPost[]>([])
  const [loading, setLoading] = useState(true)
  const [followers, setFollowers] = useState(0)
  const [following, setFollowing] = useState(0)
  const [listModal, setListModal] = useState<{ type: 'followers' | 'following' } | null>(null)

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

        if (!data && user) {
          const { data: newRow } = await supabase
            .from('Users')
            .insert({
              id: user.id,
              email: user.email || '',
              user_handle: user.user_metadata?.user_handle || user.email?.split('@')[0] || 'user',
              user_name: user.user_metadata?.user_name || null,
              user_bio: null,
              follower_count: 0,
              following_count: 0,
              isPublic: true,
            })
            .select('*')
            .single()
          if (newRow) data = newRow
        }

        if (data) {
          setProfile(data)
        }

        const { data: posts } = await supabase
          .from('Posts')
          .select('*')
          .eq('author_id', user.id)
          .order('created_at', { ascending: false })
        if (posts) setMyPosts(posts as DbPost[])

        const counts = await getFollowCounts(user.id)
        setFollowers(counts.followers)
        setFollowing(counts.following)
      } catch (e) {
        handleError(e, 'fetchProfile')
      }
      setLoading(false)
    })()
  }, [])

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.loading} />
      </View>
    )
  }

  return (
    <View style={[styles.page, { backgroundColor: colors.background, paddingTop: insets.top + 16 }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>PROFILE</Text>
        <Pressable onPress={() => router.push('/settings')} style={[styles.settingsBtn, { borderColor: colors.border, backgroundColor: colors.grayLight }]}>
          <Text style={styles.settingsBtnIcon}>⚙️</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <UserAvatar
            avatarUrl={profile?.avatar_url}
            name={profile?.user_name}
            handle={profile?.user_handle}
            size={72}
            borderColor={colors.border}
            style={styles.avatarShadow}
          />

          <Text style={[styles.name, { color: colors.text }]}>{profile?.user_name || 'Unnamed'}</Text>
          <Text style={[styles.handle, { borderColor: colors.border, backgroundColor: colors.gray }]}>@{profile?.user_handle}</Text>
          {profile?.user_bio && <Text style={[styles.bio, { color: colors.textSecondary }]}>{profile.user_bio}</Text>}
          {!profile?.user_bio && <Text style={[styles.bioMuted, { color: colors.textSecondary }]}>No bio yet</Text>}

          <View style={styles.statsRow}>
            <Pressable style={[styles.statItem, { borderColor: colors.border, backgroundColor: colors.grayLight }]} onPress={() => setListModal({ type: 'following' })}>
              <Text style={[styles.statValue, { color: colors.text }]}>{following}</Text>
              <Text style={[styles.statLabel, { color: colors.text }]}>FOLLOWING</Text>
            </Pressable>
            <Pressable style={[styles.statItem, { borderColor: colors.border, backgroundColor: colors.grayLight }]} onPress={() => setListModal({ type: 'followers' })}>
              <Text style={[styles.statValue, { color: colors.text }]}>{followers}</Text>
              <Text style={[styles.statLabel, { color: colors.text }]}>FOLLOWERS</Text>
            </Pressable>
          </View>

          <Pressable onPress={() => router.push('/settings')} style={[styles.editProfileBtn, { borderColor: colors.border, backgroundColor: colors.yellow }]}>
            <Text style={styles.editProfileBtnText}>EDIT PROFILE</Text>
          </Pressable>
        </View>

        <Text style={[styles.postsSectionTitle, { color: colors.text }]}>MY POSTS ({myPosts.length})</Text>

        {myPosts.length === 0 && (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ fontWeight: '600', color: colors.textSecondary }}>No posts yet</Text>
          </View>
        )}

        {myPosts.map(post => {
          const images = parseUrls(post.storage_key)
          return (
          <View key={post.id} style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable onPress={() => router.push(`/post/${post.id}`)}>
              {images.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.profilePostImages}>
                  {images.map((url, i) => (
                    <Image key={i} source={{ uri: url }} style={[styles.profilePostImage, { borderColor: colors.border }]} resizeMode="cover" />
                  ))}
                </ScrollView>
              )}
              {!!post.description && <Text style={[styles.postDesc, { color: colors.text }]}>{post.description}</Text>}
            </Pressable>
            <View style={styles.postMeta}>
              <Text style={[styles.postMetaText, { color: colors.textSecondary }]}>⭐ {post.like_count}</Text>
              <Text style={[styles.postMetaText, { color: colors.textSecondary }]}>✈️ {post.share_count}</Text>
              <Pressable onPress={async () => {
                setMyPosts(prev => prev.filter(p => p.id !== post.id))
                const imgs = parseUrls(post.storage_key)
                await Promise.all([
                  supabase.from('Posts').delete().eq('id', post.id),
                  imgs.length > 0 ? deleteStorageImages(imgs) : Promise.resolve(),
                ])
              }} style={[styles.deletePostBtn, { backgroundColor: colors.destructiveBg, borderColor: colors.destructiveBorder }]}>
                <Text style={styles.deletePostBtnText}>🗑️</Text>
              </Pressable>
            </View>
          </View>
          )
        })}
      </ScrollView>

      <BottomNav active="profile" />

      {profile && listModal && (
        <FollowListModal
          userId={profile.id}
          listType={listModal.type}
          visible
          onClose={() => setListModal(null)}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 16 },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: { fontSize: 28, fontWeight: '900', letterSpacing: 1 },
  settingsBtn: {
    width: 42, height: 42, borderRadius: 8, backgroundColor: '#f3f4f6',
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  settingsBtnIcon: { fontSize: 18 },
  card: {
    borderRadius: 12, padding: 24,
    borderWidth: 3, alignItems: 'center',
    boxShadow: '5px 5px 0px #000', elevation: 5,
  },
  avatarShadow: {
    boxShadow: '3px 3px 0px #000', elevation: 5,
  },
  name: { marginTop: 16, fontSize: 22, fontWeight: '900' },
  handle: {
    marginTop: 2, fontSize: 14, fontWeight: '700',
    backgroundColor: '#e5e7eb', paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1.5,
  },
  bio: { marginTop: 12, fontSize: 14, fontWeight: '500', textAlign: 'center' },
  bioMuted: { marginTop: 12, fontSize: 13, fontWeight: '600', fontStyle: 'italic' },
  statsRow: { marginTop: 24, width: '100%', flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  statItem: {
    flex: 1, alignItems: 'center',
    borderWidth: 2, borderRadius: 8, paddingVertical: 12,
  },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: { marginTop: 2, fontSize: 11, fontWeight: '800' },
  editProfileBtn: {
    marginTop: 20, width: '100%',
    borderWidth: 2, borderRadius: 8, paddingVertical: 12, alignItems: 'center',
    boxShadow: '3px 3px 0px #000', elevation: 2,
  },
  editProfileBtnText: { color: '#000', fontSize: 13, fontWeight: '900' },
  postsSectionTitle: {
    fontSize: 16, fontWeight: '900', marginTop: 28, marginBottom: 12, letterSpacing: 0.5,
  },
  postCard: {
    borderRadius: 10, padding: 12, marginBottom: 14,
    borderWidth: 2,
    boxShadow: '3px 3px 0px #000', elevation: 3,
  },
  postDesc: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  postMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  postMetaText: { fontSize: 12, fontWeight: '800' },
  deletePostBtn: { marginLeft: 'auto', backgroundColor: '#fee2e2', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1.5, borderColor: '#000' },
  deletePostBtnText: { fontSize: 12 },
  profilePostImages: { marginBottom: 8, borderRadius: 6, overflow: 'hidden' },
  profilePostImage: { width: 200, height: 160, borderRadius: 6, marginRight: 6, borderWidth: 2 },
})
