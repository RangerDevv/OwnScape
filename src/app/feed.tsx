import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { supabase } from '@/lib/supabase'
import { parseUrls } from '@/lib/storage'
import BottomNav from '@/components/bottom-nav'
import type { DbPost, DbUser } from '@/lib/database.types'

type PostWithAuthor = DbPost & { author: Pick<DbUser, 'user_name' | 'user_handle'> | null }

export default function FeedScreen() {
  const router = useRouter()
  const [posts, setPosts] = useState<PostWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set())
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null))
  }, [])

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('Posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (!error && data) {
      const rows = data as DbPost[]
      const authorIds = [...new Set(rows.map(r => r.author_id).filter(Boolean))]
      let userMap: Record<string, { user_name: string | null; user_handle: string }> = {}

      if (authorIds.length > 0) {
        const { data: users } = await supabase
          .from('Users')
          .select('id, user_name, user_handle')
          .in('id', authorIds)
        if (users) {
          for (const u of users) {
            userMap[u.id] = { user_name: u.user_name, user_handle: u.user_handle }
          }
        }
      }

      setPosts(rows.map(p => ({
        ...p,
        author: userMap[p.author_id] || null,
      })) as PostWithAuthor[])
    }
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { fetchPosts() }, [])

  const onRefresh = () => {
    setRefreshing(true)
    fetchPosts()
  }

  const handleLike = async (post: PostWithAuthor) => {
    const alreadyLiked = likedIds.has(post.id)
    const newLikeCount = post.like_count + (alreadyLiked ? -1 : 1)

    setLikedIds(prev => {
      const next = new Set(prev)
      if (alreadyLiked) next.delete(post.id); else next.add(post.id)
      return next
    })
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, like_count: newLikeCount } : p))

    const { error } = await supabase.from('Posts').update({ like_count: newLikeCount }).eq('id', post.id)
    if (error) {
      setLikedIds(prev => {
        const next = new Set(prev)
        if (alreadyLiked) next.add(post.id); else next.delete(post.id)
        return next
      })
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, like_count: post.like_count } : p))
    }
  }

  const handleDeletePost = async (postId: number) => {
    setPosts(prev => prev.filter(p => p.id !== postId))
    await supabase.from('Posts').delete().eq('id', postId)
  }

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime()
    const secs = Math.floor(diff / 1000)
    if (secs < 60) return 'JUST NOW'
    const mins = Math.floor(secs / 60)
    if (mins < 60) return `${mins} MIN AGO`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs} HOUR AGO`
    return `${Math.floor(hrs / 24)} DAY AGO`
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fffdf0' }}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    )
  }

  return (
    <View style={styles.page}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.logoContainer}>
          <View style={styles.logoDot} />
          <Text style={styles.logoText}>OWNSCAPE</Text>
        </View>
        <Pressable onPress={() => router.push('/create')} style={styles.createBtn}>
          <Text style={styles.createBtnText}>+ POST</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />}
      >
        {posts.length === 0 && (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ fontWeight: '900', fontSize: 16, color: '#000' }}>No posts yet</Text>
            <Text style={{ marginTop: 4, color: '#6b7280', fontWeight: '600' }}>Be the first to share something!</Text>
          </View>
        )}

        {posts.map((post) => (
          <View key={post.id} style={styles.postCard}>
            <View style={styles.authorRow}>
              <View style={styles.authorInfo}>
                <View style={styles.avatarSmall}>
                  <Text style={styles.avatarLetter}>
                    {(post.author?.user_name || post.handle || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.authorName}>{post.author?.user_name || post.handle}</Text>
                  <Text style={styles.authorHandle}>@{post.author?.user_handle || post.handle}</Text>
                </View>
              </View>
              <Text style={styles.postTime}>{timeAgo(post.created_at)}</Text>
            </View>

            {(() => {
              const images = parseUrls(post.storage_key)
              return images.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageContainer}>
                  {images.map((url, i) => (
                    <Image key={i} source={{ uri: url }} style={styles.postImage} resizeMode="cover" />
                  ))}
                </ScrollView>
              ) : null
            })()}

            {!!post.description && <Text style={styles.postCaption}>{post.description}</Text>}

            <View style={styles.actionFooter}>
              <Pressable onPress={() => handleLike(post)} style={styles.actionBtn}>
                <Text style={styles.actionIcon}>{likedIds.has(post.id) ? '⭐' : '☆'}</Text>
                <Text style={styles.actionCount}>{post.like_count}</Text>
              </Pressable>
              <Pressable onPress={() => router.push(`/comments/${post.id}`)} style={styles.actionBtn}>
                <Text style={styles.actionIcon}>💬</Text>
              </Pressable>
              <Pressable style={styles.actionBtn}>
                <Text style={styles.actionIcon}>✈️</Text>
              </Pressable>
              {currentUserId === post.author_id && (
                <Pressable onPress={() => handleDeletePost(post.id)} style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnText}>🗑️</Text>
                </Pressable>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <BottomNav active="feed" />
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fffdf0' },
  topHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#ffffff',
    borderBottomWidth: 3, borderBottomColor: '#000000',
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff6347', marginRight: 4 },
  logoText: { fontSize: 18, fontWeight: '900', color: '#000', letterSpacing: 1 },
  createBtn: {
    backgroundColor: '#ffe600', borderWidth: 2, borderColor: '#000', borderRadius: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 2,
  },
  createBtnText: { fontSize: 12, fontWeight: '900', color: '#000' },
  scrollContent: { paddingBottom: 110 },
  postCard: {
    backgroundColor: '#ffffff', marginHorizontal: 16, marginTop: 20, borderRadius: 12, padding: 16,
    borderWidth: 3, borderColor: '#000000',
    shadowColor: '#000000', shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  authorInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarSmall: {
    width: 40, height: 40, borderRadius: 6, backgroundColor: '#ffe600', borderWidth: 2, borderColor: '#000',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: 16, fontWeight: '900', color: '#000' },
  authorName: { fontSize: 15, fontWeight: '900', color: '#000' },
  authorHandle: { fontSize: 11, fontWeight: '700', color: '#6b7280' },
  postTime: {
    fontSize: 11, fontWeight: '700', color: '#000', backgroundColor: '#e5e7eb',
    paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1.5, borderColor: '#000',
  },
  imageContainer: {
    width: '100%', height: 320, borderRadius: 6,
    backgroundColor: '#f3f4f6', marginBottom: 12, borderWidth: 3, borderColor: '#000',
    overflow: 'hidden',
  },
  postImage: { width: 320, height: '100%', marginRight: 4 },
  postCaption: { fontSize: 14, fontWeight: '500', color: '#1f2937', lineHeight: 22, marginBottom: 16 },
  actionFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#ff70a6', borderRadius: 8, padding: 8,
    borderWidth: 3, borderColor: '#000',
    shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 2, borderColor: '#000',
  },
  actionIcon: { fontSize: 14 },
  actionCount: { fontSize: 12, fontWeight: '900', color: '#000' },
  deleteBtn: {
    marginLeft: 'auto', backgroundColor: '#fee2e2', borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderWidth: 2, borderColor: '#000',
  },
  deleteBtnText: { fontSize: 14 },
})
