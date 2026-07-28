import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { supabase } from '@/lib/supabase'
import { parseUrls } from '@/lib/storage'
import { followUser, getFollowCounts, isFollowing, unfollowUser } from '@/lib/follows'
import { handleError } from '@/lib/errors'
import { useAppTheme } from '@/hooks/use-app-theme'
import BottomNav from '@/components/bottom-nav'
import FollowListModal from '@/components/follow-list-modal'
import { ProfileCardSkeleton } from '@/components/skeleton-loader'
import UserAvatar from '@/components/user-avatar'
import type { DbPost, DbUser } from '@/lib/database.types'

const USER_PROFILE_IMAGE_WIDTH = Dimensions.get('window').width - 100

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { colors } = useAppTheme()
  const [profile, setProfile] = useState<DbUser | null>(null)
  const [posts, setPosts] = useState<DbPost[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [following, setFollowing] = useState(false)
  const [followers, setFollowers] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [togglingFollow, setTogglingFollow] = useState(false)
  const [listModal, setListModal] = useState<{ type: 'followers' | 'following' } | null>(null)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUserId(user?.id || null)

        const [userResult, postsResult, counts] = await Promise.all([
          supabase.from('Users').select('*').eq('id', id).single(),
          supabase.from('Posts').select('*').eq('author_id', id).order('created_at', { ascending: false }).limit(20),
          getFollowCounts(id),
          user ? isFollowing(user.id, id) : Promise.resolve(false),
        ])

        if (userResult.data) setProfile(userResult.data)
        if (postsResult.data) setPosts(postsResult.data as DbPost[])
        setFollowers(counts.followers)
        setFollowingCount(counts.following)
        setFollowing(user ? await isFollowing(user.id, id) : false)
      } catch (e) {
        handleError(e, 'fetchUserProfile')
      }
      setLoading(false)
    })()
  }, [id])

  const handleToggleFollow = async () => {
    if (!currentUserId || !id) return
    setTogglingFollow(true)
    try {
      if (following) {
        const ok = await unfollowUser(currentUserId, id)
        if (ok) { setFollowing(false); setFollowers(prev => Math.max(0, prev - 1)) }
      } else {
        const ok = await followUser(currentUserId, id)
        if (ok) { setFollowing(true); setFollowers(prev => prev + 1) }
      }
    } catch (e) {
      handleError(e, 'handleToggleFollow')
    }
    setTogglingFollow(false)
  }

  if (loading) {
    return (
      <View style={[styles.page, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={[styles.backBtn, { backgroundColor: colors.grayLight, borderColor: colors.border }]}>
            <Text style={[styles.backBtnText, { color: colors.text }]}>← BACK</Text>
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>PROFILE</Text>
          <View style={{ width: 60 }} />
        </View>
        <ProfileCardSkeleton />
      </View>
    )
  }

  const isOwn = currentUserId === id

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.grayLight, borderColor: colors.border }]}>
          <Text style={[styles.backBtnText, { color: colors.text }]}>← BACK</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>PROFILE</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <UserAvatar
            avatarUrl={profile?.avatar_url}
            name={profile?.user_name}
            handle={profile?.user_handle}
            size={72}
            borderColor={colors.border}
          />
          <Text style={[styles.name, { color: colors.text }]}>{profile?.user_name || 'Unnamed'}</Text>
          <Text style={[styles.handle, { color: colors.text, backgroundColor: colors.gray, borderColor: colors.border }]}>@{profile?.user_handle}</Text>
          {profile?.user_bio && <Text style={[styles.bio, { color: colors.textSecondary }]}>{profile.user_bio}</Text>}
          {!profile?.user_bio && <Text style={[styles.bioMuted, { color: colors.textSecondary }]}>No bio yet</Text>}

          <View style={styles.statsRow}>
            <Pressable style={[styles.statItem, { backgroundColor: colors.grayLight, borderColor: colors.border }]} onPress={() => setListModal({ type: 'following' })}>
              <Text style={[styles.statValue, { color: colors.text }]}>{followingCount}</Text>
              <Text style={[styles.statLabel, { color: colors.text }]}>FOLLOWING</Text>
            </Pressable>
            <Pressable style={[styles.statItem, { backgroundColor: colors.grayLight, borderColor: colors.border }]} onPress={() => setListModal({ type: 'followers' })}>
              <Text style={[styles.statValue, { color: colors.text }]}>{followers}</Text>
              <Text style={[styles.statLabel, { color: colors.text }]}>FOLLOWERS</Text>
            </Pressable>
          </View>

          {!isOwn && (
            <Pressable
              style={[styles.followBtn, { backgroundColor: following ? colors.yellow : colors.text, borderColor: colors.border }]}
              onPress={handleToggleFollow}
              disabled={togglingFollow}
            >
              <Text style={[styles.followBtnText, { color: following ? colors.text : colors.card }]}>
                {togglingFollow ? '...' : following ? 'FOLLOWING' : 'FOLLOW'}
              </Text>
            </Pressable>
          )}
        </View>

        <Text style={[styles.postsSectionTitle, { color: colors.text }]}>POSTS ({posts.length})</Text>

        {posts.length === 0 && (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 36, marginBottom: 12 }}>📝</Text>
            <Text style={{ fontWeight: '900', fontSize: 16, color: colors.textSecondary }}>No posts yet</Text>
          </View>
        )}

        {posts.map(post => {
          const images = parseUrls(post.storage_key)
          return (
          <View key={post.id} style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable onPress={() => router.push(`/post/${post.id}`)}>
              {images.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
                  {images.map((url, i) => (
                    <Image key={i} source={{ uri: url }} style={[styles.postImage, { borderColor: colors.border }]} resizeMode="cover" />
                  ))}
                </ScrollView>
              )}
              {!!post.description && <Text style={[styles.postDesc, { color: colors.text }]}>{post.description}</Text>}
            </Pressable>
            <View style={styles.postMeta}>
              <Text style={[styles.postMetaText, { color: colors.textSecondary }]}>⭐ {post.like_count}</Text>
              <Text style={[styles.postMetaText, { color: colors.textSecondary }]}>✈️ {post.share_count}</Text>
            </View>
          </View>
          )
        })}
      </ScrollView>

      <BottomNav active="explore" />

      {id && listModal && (
        <FollowListModal
          userId={id}
          listType={listModal.type}
          visible
          onClose={() => setListModal(null)}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 3,
  },
  backBtn: {
    paddingVertical: 6, paddingHorizontal: 10,
    borderWidth: 2, borderRadius: 6,
  },
  backBtnText: { fontSize: 12, fontWeight: '900' },
  headerTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  card: {
    borderRadius: 12, padding: 24, margin: 16,
    borderWidth: 3, alignItems: 'center',
    boxShadow: '5px 5px 0px #000', elevation: 5,
  },

  name: { marginTop: 16, fontSize: 22, fontWeight: '900' },
  handle: {
    marginTop: 2, fontSize: 14, fontWeight: '700',
    paddingHorizontal: 8, paddingVertical: 2,
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
  followBtn: {
    marginTop: 20, width: '100%',
    borderWidth: 2, borderRadius: 8, paddingVertical: 12, alignItems: 'center',
    boxShadow: '3px 3px 0px #000', elevation: 2,
  },
  followBtnText: { fontSize: 13, fontWeight: '900' },
  postsSectionTitle: {
    fontSize: 16, fontWeight: '900', marginTop: 12, marginBottom: 12,
    paddingHorizontal: 16, letterSpacing: 0.5,
  },
  postCard: {
    borderRadius: 10, padding: 12, marginHorizontal: 16, marginBottom: 14,
    borderWidth: 2,
    boxShadow: '3px 3px 0px #000', elevation: 3,
  },
  imageRow: { marginBottom: 8, borderRadius: 6, overflow: 'hidden' },
  postImage: { width: USER_PROFILE_IMAGE_WIDTH, height: 160, borderRadius: 6, marginRight: 6, borderWidth: 2 },
  postDesc: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  postMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  postMetaText: { fontSize: 12, fontWeight: '800' },
})
