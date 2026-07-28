import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { parseUrls } from '@/lib/storage'
import { handleError } from '@/lib/errors'
import { useAppTheme } from '@/hooks/use-app-theme'
import { getTrendingHashtags, getPostsByHashtag } from '@/lib/hashtags'
import BottomNav from '@/components/bottom-nav'
import CommentsModal from '@/components/comments-modal'
import UserAvatar from '@/components/user-avatar'
import type { DbHashtag, DbPost, DbUser } from '@/lib/database.types'

type TrendingPost = DbPost & { images: string[] }
type SearchMode = 'posts' | 'users'

export default function ExploreScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ tag?: string; q?: string; mode?: string }>()
  const { colors } = useAppTheme()
  const [query, setQuery] = useState('')
  const [posts, setPosts] = useState<TrendingPost[]>([])
  const [users, setUsers] = useState<DbUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searched, setSearched] = useState(false)
  const [mode, setMode] = useState<SearchMode>('posts')
  const [commentPostId, setCommentPostId] = useState<number | null>(null)
  const [trendingHashtags, setTrendingHashtags] = useState<DbHashtag[]>([])
  const [activeHashtag, setActiveHashtag] = useState<string | null>(null)
  const [hashtagLoading, setHashtagLoading] = useState(false)
  const hashtagSearchRef = useRef(false)

  const fetchTrendingHashtags = async () => {
    setHashtagLoading(true)
    const tags = await getTrendingHashtags()
    setTrendingHashtags(tags)
    setHashtagLoading(false)
  }

  const searchByHashtag = async (tag: string) => {
    const clean = tag.startsWith('#') ? tag.slice(1) : tag
    hashtagSearchRef.current = true
    setActiveHashtag(tag)
    setMode('posts')
    setLoading(true)
    setSearched(true)
    setQuery(`#${clean}`)
    const results = await getPostsByHashtag(clean)
    setPosts(results.map(p => ({ ...p, images: parseUrls(p.storage_key) })))
    setLoading(false)
    hashtagSearchRef.current = false
  }

  const fetchTrending = async (force = false) => {
    if (!force && (activeHashtag || params.tag)) return
    setLoading(true)
    setSearched(false)
    try {
      const { data } = await supabase
        .from('Posts')
        .select('*')
        .order('like_count', { ascending: false })
        .limit(20)
      if (data) {
        setPosts((data as DbPost[]).map(p => ({ ...p, images: parseUrls(p.storage_key) })))
      }
    } catch (e) {
      handleError(e, 'fetchTrending')
    }
    setLoading(false)
  }

  const search = async () => {
    const q = query.trim()
    if (!q) { fetchTrending(); return }
    setLoading(true)
    setSearched(true)

    try {
      if (mode === 'posts') {
        const { data } = await supabase
          .from('Posts')
          .select('*')
          .ilike('description', `%${q}%`)
          .order('like_count', { ascending: false })
          .limit(20)
        if (data) {
          setPosts((data as DbPost[]).map(p => ({ ...p, images: parseUrls(p.storage_key) })))
        }
      } else {
        const { data } = await supabase
          .from('Users')
          .select('*')
          .or(`user_handle.ilike.%${q}%,user_name.ilike.%${q}%`)
          .limit(20)
        if (data) setUsers(data as DbUser[])
      }
    } catch (e) {
      handleError(e, 'search')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTrending(true)
    fetchTrendingHashtags()
  }, [])

  useEffect(() => {
    if (params.tag) {
      searchByHashtag(`#${params.tag}`)
    }
  }, [params.tag])

  useEffect(() => {
    if (params.q) {
      setMode(params.mode === 'users' ? 'users' : 'posts')
      setQuery(params.q)
    }
  }, [params.q])

  useEffect(() => {
    if (hashtagSearchRef.current) return
    setPosts([]); setUsers([]); setSearched(false); setActiveHashtag(null); search()
  }, [mode])

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <View style={[styles.searchHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.modeRow}>
          <Pressable style={[styles.modeTab, { backgroundColor: colors.grayLight, borderColor: colors.border }, mode === 'posts' && { backgroundColor: colors.text }]} onPress={() => setMode('posts')}>
            <Text style={[styles.modeTabText, { color: colors.text }, mode === 'posts' && { color: colors.card }]}>{'POSTS'}</Text>
          </Pressable>
          <Pressable style={[styles.modeTab, { backgroundColor: colors.grayLight, borderColor: colors.border }, mode === 'users' && { backgroundColor: colors.text }]} onPress={() => setMode('users')}>
            <Text style={[styles.modeTabText, { color: colors.text }, mode === 'users' && { color: colors.card }]}>{'USERS'}</Text>
          </Pressable>
        </View>
        <TextInput
          placeholder={mode === 'posts' ? 'Search posts by description...' : 'Search users by name or handle...'}
          placeholderTextColor={colors.textSecondary}
          style={[styles.searchInput, { backgroundColor: colors.grayLight, borderColor: colors.border, color: colors.text }]}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={search}
          returnKeyType="search"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {trendingHashtags.length > 0 && !searched && mode === 'posts' && (
          <View style={[styles.hashtagSection, { borderBottomColor: colors.border }]}>
            <Text style={[styles.hashtagSectionTitle, { color: colors.text }]}>TRENDING HASHTAGS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hashtagRow}>
              {trendingHashtags.map(h => (
                <Pressable
                  key={h.id}
                  style={[styles.hashtagChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => searchByHashtag(`#${h.tag}`)}
                >
                  <Text style={[styles.hashtagChipTag, { color: colors.pink }]}>#{h.tag}</Text>
                  <Text style={[styles.hashtagChipCount, { color: colors.textSecondary }]}>{h.post_count}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {activeHashtag && (
          <View style={[styles.activeHashtagBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.activeHashtagText, { color: colors.pink }]}>{activeHashtag}</Text>
              <Pressable onPress={() => { setActiveHashtag(null); setQuery(''); fetchTrending(true) }}>
              <Text style={[styles.clearBtn, { color: colors.text, backgroundColor: colors.gray, borderColor: colors.border }]}>CLEAR</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {activeHashtag ? activeHashtag : !searched ? (mode === 'posts' ? 'TRENDING' : 'SUGGESTED') : 'RESULTS'}
          </Text>
          {searched && !activeHashtag && (
            <Pressable onPress={() => { setQuery(''); fetchTrending() }}>
              <Text style={[styles.clearBtn, { color: colors.text, backgroundColor: colors.gray, borderColor: colors.border }]}>CLEAR</Text>
            </Pressable>
          )}
        </View>

        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.loading} />
          </View>
        ) : mode === 'posts' ? (
          posts.length === 0 ? (
            <View style={{ padding: 50, alignItems: 'center' }}>
              <Text style={{ fontSize: 36, marginBottom: 12 }}>🔍</Text>
              <Text style={{ fontWeight: '900', fontSize: 16, color: colors.textSecondary }}>No posts found</Text>
              <Text style={{ marginTop: 4, color: colors.textSecondary, fontWeight: '600', fontSize: 13 }}>
                {activeHashtag ? 'Post with this hashtag or check RLS policies' : 'Try a different search term'}
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {posts.map(item => {
                const thumb = item.images[0]
                return (
                  <Pressable key={item.id} style={[styles.gridItem, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push(`/post/${item.id}`)}>
                    {thumb ? (
                      <Image source={{ uri: thumb }} style={styles.gridImage} />
                    ) : (
                      <View style={[styles.gridImagePlaceholder, { backgroundColor: colors.grayLight }]}>
                        <Text style={styles.gridPlaceholderText}>📝</Text>
                      </View>
                    )}
                    <View style={[styles.gridOverlay, { backgroundColor: colors.card }]}>
                      <Text style={[styles.gridHandle, { color: colors.text }]}>@{item.handle}</Text>
                      <Text style={[styles.gridLikes, { color: colors.text }]}>⭐ {item.like_count}</Text>
                    </View>
                  </Pressable>
                )
              })}
            </View>
          )
        ) : (
          users.length === 0 ? (
            <View style={{ padding: 50, alignItems: 'center' }}>
              <Text style={{ fontSize: 36, marginBottom: 12 }}>👥</Text>
              <Text style={{ fontWeight: '900', fontSize: 16, color: colors.textSecondary }}>No users found</Text>
              <Text style={{ marginTop: 4, color: colors.textSecondary, fontWeight: '600', fontSize: 13 }}>Try a different search term</Text>
            </View>
          ) : (
            <View style={styles.userList}>
              {users.map(u => (
                <Pressable key={u.id} style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push(`/profile/${u.id}`)}>
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
            </View>
          )
        )}
      </ScrollView>

      <BottomNav active="explore" />

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
  searchHeader: { padding: 16, borderBottomWidth: 3 },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  hashtagSection: {
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12, borderBottomWidth: 2,
  },
  hashtagSectionTitle: { fontSize: 14, fontWeight: '900', marginBottom: 12, letterSpacing: 0.5 },
  hashtagRow: { flexDirection: 'row' },
  hashtagChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 14, marginRight: 10,
    borderRadius: 8, borderWidth: 2,
    boxShadow: '2px 2px 0px #000', elevation: 2,
  },
  hashtagChipTag: { fontSize: 14, fontWeight: '900' },
  hashtagChipCount: { fontSize: 11, fontWeight: '700' },
  activeHashtagBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, marginHorizontal: 16, marginTop: 16,
    borderRadius: 8, borderWidth: 2,
    boxShadow: '2px 2px 0px #000', elevation: 2,
  },
  activeHashtagText: { fontSize: 16, fontWeight: '900' },
  modeTab: {
    flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6,
    borderWidth: 2,
  },
  modeTabText: { fontSize: 12, fontWeight: '900' },
  searchInput: {
    borderWidth: 2, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontWeight: '600',
  },
  scrollContent: { paddingBottom: 110 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginTop: 20, marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  clearBtn: {
    fontSize: 12, fontWeight: '900',
    paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1.5, borderRadius: 4,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 12,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%', height: 180, borderRadius: 8,
    borderWidth: 2.5, overflow: 'hidden',
    boxShadow: '3px 3px 0px #000', elevation: 3,
    marginBottom: 4,
  },
  gridImage: { width: '100%', height: '100%' },
  gridImagePlaceholder: {
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
  },
  gridPlaceholderText: { fontSize: 32 },
  gridOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 6, borderTopWidth: 2, borderTopColor: '#000',
  },
  gridHandle: { fontSize: 11, fontWeight: '900' },
  gridLikes: { fontSize: 11, fontWeight: '900' },
  userList: { paddingHorizontal: 16, gap: 10 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 8, padding: 14,
    borderWidth: 2,
    boxShadow: '2px 2px 0px #000', elevation: 2,
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '900' },
  userHandle: { fontSize: 12, fontWeight: '700' },
  userBio: { fontSize: 12, fontWeight: '500', marginTop: 2 },
})
