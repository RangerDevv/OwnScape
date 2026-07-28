import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Animated, Dimensions, Image, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from 'react-native'
import { supabase } from '@/lib/supabase'
import { deleteStorageImages, parseUrls } from '@/lib/storage'
import { addLike, getLikedPostIds, removeLike } from '@/lib/likes'
import { getUnreadCount, subscribeToNotifications } from '@/lib/notifications'
import { unlinkHashtags } from '@/lib/hashtags'
import { removeMentions } from '@/lib/mentions'
import { handleError } from '@/lib/errors'
import { useAppTheme } from '@/hooks/use-app-theme'
import BottomNav from '@/components/bottom-nav'
import CommentsModal from '@/components/comments-modal'
import { RichText } from '@/components/rich-text'
import UserAvatar from '@/components/user-avatar'
import { PostCardSkeleton } from '@/components/skeleton-loader'
import type { DbPost, DbUser } from '@/lib/database.types'

type PostWithAuthor = DbPost & { author: Pick<DbUser, 'user_name' | 'user_handle' | 'avatar_url'> | null }

const SCREEN_WIDTH = Dimensions.get('window').width
const FEED_IMAGE_WIDTH = SCREEN_WIDTH - 70

let readSubId = 0

const PAGE_SIZE = 20

export default function FeedScreen() {
  const router = useRouter()
  const { colors } = useAppTheme()
  const [posts, setPosts] = useState<PostWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set())
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [commentPostId, setCommentPostId] = useState<number | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useFocusEffect(
    useCallback(() => {
      if (!currentUserId) return
      getUnreadCount(currentUserId).then(setUnreadCount)
    }, [currentUserId])
  )

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id || null
      setCurrentUserId(uid)
      if (uid) {
        setUnreadCount(await getUnreadCount(uid))
      }
    })
  }, [])

  useEffect(() => {
    if (!currentUserId) return
    const unsub = subscribeToNotifications(currentUserId, () => {
      setUnreadCount(prev => prev + 1)
    })
    return unsub
  }, [currentUserId])

  useEffect(() => {
    if (!currentUserId) return
    const id = ++readSubId
    const channel = supabase
      .channel(`notifications-read-${currentUserId}-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Notifications',
          filter: `recipient_id=eq.${currentUserId}`,
        },
        (payload) => {
          if ((payload.new as { read: boolean }).read) {
            setUnreadCount(prev => Math.max(0, prev - 1))
          }
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [currentUserId])

  const enrichPosts = async (rows: DbPost[]): Promise<PostWithAuthor[]> => {
    try {
      const authorIds = [...new Set(rows.map(r => r.author_id).filter(Boolean))]
      let userMap: Record<string, { user_name: string | null; user_handle: string; avatar_url: string | null }> = {}
      if (authorIds.length > 0) {
        const { data: users } = await supabase
          .from('Users')
          .select('id, user_name, user_handle, avatar_url')
          .in('id', authorIds)
        if (users) {
          for (const u of users) {
            userMap[u.id] = { user_name: u.user_name, user_handle: u.user_handle, avatar_url: u.avatar_url }
          }
        }
      }
      return rows.map(p => ({ ...p, author: userMap[p.author_id] || null })) as PostWithAuthor[]
    } catch (e) {
      handleError(e, 'enrichPosts')
      return rows.map(p => ({ ...p, author: null })) as PostWithAuthor[]
    }
  }

  const loadLikedIds = async () => {
    if (!currentUserId) return
    setLikedIds(await getLikedPostIds(currentUserId))
  }

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('Posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)

      if (!error && data) {
        setPosts(await enrichPosts(data as DbPost[]))
        setHasMore(data.length === PAGE_SIZE)
      } else if (error) {
        handleError(error, 'fetchPosts')
      }
    } catch (e) {
      handleError(e, 'fetchPosts')
    }
    setLoading(false)
    setRefreshing(false)
    loadLikedIds()
  }

  useEffect(() => { fetchPosts() }, [currentUserId])

  const onRefresh = () => {
    setRefreshing(true)
    fetchPosts()
  }

  const loadMore = async () => {
    if (loadingMore || !hasMore || posts.length === 0) return
    setLoadingMore(true)
    try {
      const lastCreated = posts[posts.length - 1].created_at
      const { data, error } = await supabase
        .from('Posts')
        .select('*')
        .order('created_at', { ascending: false })
        .lt('created_at', lastCreated)
        .limit(PAGE_SIZE)

      if (!error && data) {
        const newPosts = await enrichPosts(data as DbPost[])
        setPosts(prev => [...prev, ...newPosts])
        setHasMore(data.length === PAGE_SIZE)
      } else if (error) {
        handleError(error, 'loadMore')
      }
    } catch (e) {
      handleError(e, 'loadMore')
    }
    setLoadingMore(false)
  }

  const handleLike = async (post: PostWithAuthor) => {
    if (!currentUserId) return
    const alreadyLiked = likedIds.has(post.id)
    const newLikeCount = post.like_count + (alreadyLiked ? -1 : 1)

    setLikedIds(prev => {
      const next = new Set(prev)
      if (alreadyLiked) next.delete(post.id); else next.add(post.id)
      return next
    })
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, like_count: newLikeCount } : p))

    const ok = alreadyLiked
      ? await removeLike(currentUserId, post.id)
      : await addLike(currentUserId, post.id)

    if (!ok) {
      setLikedIds(prev => {
        const next = new Set(prev)
        if (alreadyLiked) next.add(post.id); else next.delete(post.id)
        return next
      })
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, like_count: post.like_count } : p))
    }
  }

  const handleDeletePost = async (post: PostWithAuthor) => {
    setPosts(prev => prev.filter(p => p.id !== post.id))
    try {
      const images = parseUrls(post.storage_key)
      await Promise.all([
        supabase.from('Posts').delete().eq('id', post.id),
        images.length > 0 ? deleteStorageImages(images) : Promise.resolve(),
        unlinkHashtags(post.id),
        removeMentions(post.id),
      ])
    } catch (e) {
      handleError(e, 'handleDeletePost')
    }
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
      <View style={[styles.page, { backgroundColor: colors.background }]}>
        <View style={[styles.topHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.logoContainer}>
            <View style={styles.logoDot} />
            <Text style={[styles.logoText, { color: colors.text }]}>OWNSCAPE</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={[styles.createBtn, { backgroundColor: colors.grayLight, borderColor: colors.border }]}>
              <Text style={[styles.createBtnText, { color: colors.text }]}>🔔</Text>
            </View>
            <View style={[styles.createBtn, { backgroundColor: colors.grayLight, borderColor: colors.border }]}>
              <Text style={[styles.createBtnText, { color: colors.text }]}>+ POST</Text>
            </View>
          </View>
        </View>
        <PostCardSkeleton />
        <PostCardSkeleton />
        <PostCardSkeleton />
      </View>
    )
  }

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <View style={[styles.topHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.logoContainer}>
          <View style={styles.logoDot} />
          <Text style={[styles.logoText, { color: colors.text }]}>OWNSCAPE</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Pressable onPress={() => router.push('/inbox')} style={[styles.createBtn, { backgroundColor: unreadCount > 0 ? colors.pink : colors.grayLight, borderColor: colors.border }]}>
            <Text style={[styles.createBtnText, { color: colors.text }]}>🔔{unreadCount > 0 ? ` ${unreadCount}` : ''}</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/create')} style={[styles.createBtn, { backgroundColor: colors.yellow, borderColor: colors.border }]}>
            <Text style={[styles.createBtnText, { color: colors.text }]}>+ POST</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
      >
        {posts.length === 0 && (
          <View style={{ padding: 60, alignItems: 'center' }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📷</Text>
            <Text style={{ fontWeight: '900', fontSize: 18, color: colors.text }}>No posts yet</Text>
            <Text style={{ marginTop: 6, color: colors.textSecondary, fontWeight: '600', fontSize: 14, textAlign: 'center' }}>Be the first to share something with the community!</Text>
          </View>
        )}

        {posts.map((post) => (
          <View key={post.id} style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.authorRow}>
              <View style={styles.authorInfo}>
                <UserAvatar
                  avatarUrl={post.author?.avatar_url}
                  name={post.author?.user_name}
                  handle={post.author?.user_handle || post.handle}
                  size={36}
                  borderColor={colors.border}
                />
                <Pressable onPress={() => router.push(`/profile/${post.author_id}`)}>
                  <Text style={[styles.authorName, { color: colors.text }]}>{post.author?.user_name || post.handle}</Text>
                  <Text style={[styles.authorHandle, { color: colors.textSecondary }]}>@{post.author?.user_handle || post.handle}</Text>
                </Pressable>
              </View>
              <Text style={[styles.postTime, { color: colors.text, backgroundColor: colors.gray, borderColor: colors.border }]}>{timeAgo(post.created_at)}</Text>
            </View>

            <Pressable onPress={() => router.push(`/post/${post.id}`)}>
              {(() => {
                const images = parseUrls(post.storage_key)
                return images.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.imageContainer, { backgroundColor: colors.grayLight, borderColor: colors.border }]}>
                    {images.map((url, i) => (
                      <Image key={i} source={{ uri: url }} style={styles.postImage} resizeMode="cover" />
                    ))}
                  </ScrollView>
                ) : null
              })()}
              {!!post.description && (
                <RichText
                  text={post.description}
                  style={[styles.postCaption, { color: colors.text }]}
                  hashtagStyle={{ color: colors.pink }}
                  mentionStyle={{ color: colors.pink }}
                  onHashtagPress={(tag) => router.push(`/explore?tag=${encodeURIComponent(tag.slice(1))}`)}
                  onMentionPress={(handle) => router.push(`/explore?q=${encodeURIComponent(handle.slice(1))}&mode=users`)}
                />
              )}
            </Pressable>

            <View style={[styles.actionFooter, { backgroundColor: colors.pink, borderColor: colors.border }]}>
              <Pressable onPress={() => handleLike(post)} style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={styles.actionIcon}>{likedIds.has(post.id) ? '⭐' : '☆'}</Text>
                <Text style={[styles.actionCount, { color: colors.text }]}>{post.like_count}</Text>
              </Pressable>
              <Pressable onPress={() => setCommentPostId(post.id)} style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={styles.actionIcon}>💬</Text>
              </Pressable>
              <Pressable onPress={async () => {
                try {
                  await Share.share({ message: `Check out this post by @${post.handle}: "${post.description}" on OwnScape!` })
                } catch {}
              }} style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={styles.actionIcon}>✈️</Text>
              </Pressable>
              {currentUserId === post.author_id && (
                <Pressable onPress={() => handleDeletePost(post)} style={[styles.deleteBtn, { backgroundColor: colors.destructiveBg, borderColor: colors.destructiveBorder }]}>
                  <Text style={styles.deleteBtnText}>🗑️</Text>
                </Pressable>
              )}
            </View>
          </View>
        ))}

        {hasMore && (
          <Pressable
            style={[styles.loadMoreBtn, { backgroundColor: colors.text, borderColor: colors.border }]}
            onPress={loadMore}
            disabled={loadingMore}
          >
            <Text style={[styles.loadMoreText, { color: colors.card }]}>
              {loadingMore ? 'LOADING...' : 'LOAD MORE'}
            </Text>
          </Pressable>
        )}
      </ScrollView>

      <BottomNav active="feed" />

      <CommentsModal
        postId={commentPostId ?? 0}
        visible={commentPostId !== null}
        onClose={() => setCommentPostId(null)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  topHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 3,
  },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff6347', marginRight: 4 },
  logoText: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  createBtn: {
    borderWidth: 2, borderRadius: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    boxShadow: '2px 2px 0px #000', elevation: 2,
  },
  createBtnText: { fontSize: 12, fontWeight: '900' },
  scrollContent: { paddingBottom: 110 },
  postCard: {
    marginHorizontal: 16, marginTop: 20, borderRadius: 12, padding: 16,
    borderWidth: 3,
    boxShadow: '5px 5px 0px #000', elevation: 5,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  authorInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  authorName: { fontSize: 15, fontWeight: '900' },
  authorHandle: { fontSize: 11, fontWeight: '700' },
  postTime: {
    fontSize: 11, fontWeight: '700',
    paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1.5,
  },
  imageContainer: {
    width: '100%', height: 320, borderRadius: 6,
    marginBottom: 12, borderWidth: 3,
    overflow: 'hidden',
  },
  postImage: { width: FEED_IMAGE_WIDTH, height: '100%', marginRight: 4 },
  postCaption: { fontSize: 14, fontWeight: '500', lineHeight: 22, marginBottom: 16 },
  actionFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 8, padding: 8,
    borderWidth: 3,
    boxShadow: '3px 3px 0px #000', elevation: 3,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 2,
  },
  actionIcon: { fontSize: 14 },
  actionCount: { fontSize: 12, fontWeight: '900' },
  deleteBtn: {
    marginLeft: 'auto', borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderWidth: 2,
  },
  deleteBtnText: { fontSize: 14 },
  loadMoreBtn: {
    marginHorizontal: 16, marginTop: 20, marginBottom: 20,
    borderRadius: 8, paddingVertical: 14, alignItems: 'center',
    borderWidth: 2,
  },
  loadMoreText: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
})
