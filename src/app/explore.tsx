import { useEffect, useState } from 'react'
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { parseUrls } from '@/lib/storage'
import BottomNav from '@/components/bottom-nav'
import CommentsModal from '@/components/comments-modal'
import type { DbPost, DbUser } from '@/lib/database.types'

type TrendingPost = DbPost & { images: string[] }
type SearchMode = 'posts' | 'users'

export default function ExploreScreen() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [posts, setPosts] = useState<TrendingPost[]>([])
  const [users, setUsers] = useState<DbUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searched, setSearched] = useState(false)
  const [mode, setMode] = useState<SearchMode>('posts')
  const [commentPostId, setCommentPostId] = useState<number | null>(null)

  const fetchTrending = async () => {
    setLoading(true)
    setSearched(false)
    const { data } = await supabase
      .from('Posts')
      .select('*')
      .order('like_count', { ascending: false })
      .limit(20)
    if (data) {
      setPosts((data as DbPost[]).map(p => ({ ...p, images: parseUrls(p.storage_key) })))
    }
    setLoading(false)
  }

  const search = async () => {
    const q = query.trim()
    if (!q) { fetchTrending(); return }
    setLoading(true)
    setSearched(true)

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
    setLoading(false)
  }

  useEffect(() => { fetchTrending() }, [])

  useEffect(() => { setPosts([]); setUsers([]); setSearched(false); search() }, [mode])

  return (
    <View style={styles.page}>
      <View style={styles.searchHeader}>
        <View style={styles.modeRow}>
          <Pressable style={[styles.modeTab, mode === 'posts' && styles.modeTabActive]} onPress={() => setMode('posts')}>
            <Text style={[styles.modeTabText, mode === 'posts' && styles.modeTabTextActive]}>POSTS</Text>
          </Pressable>
          <Pressable style={[styles.modeTab, mode === 'users' && styles.modeTabActive]} onPress={() => setMode('users')}>
            <Text style={[styles.modeTabText, mode === 'users' && styles.modeTabTextActive]}>USERS</Text>
          </Pressable>
        </View>
        <TextInput
          placeholder={mode === 'posts' ? 'Search posts by description...' : 'Search users by name or handle...'}
          placeholderTextColor="#6b7280"
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={search}
          returnKeyType="search"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {!searched ? (mode === 'posts' ? 'TRENDING' : 'SUGGESTED') : 'RESULTS'}
          </Text>
          {searched && (
            <Pressable onPress={() => { setQuery(''); fetchTrending() }}>
              <Text style={styles.clearBtn}>CLEAR</Text>
            </Pressable>
          )}
        </View>

        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#111827" />
          </View>
        ) : mode === 'posts' ? (
          posts.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ fontWeight: '900', fontSize: 16, color: '#9ca3af' }}>No posts found</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {posts.map(item => {
                const thumb = item.images[0]
                return (
                  <Pressable key={item.id} style={styles.gridItem} onPress={() => setCommentPostId(item.id)}>
                    {thumb ? (
                      <Image source={{ uri: thumb }} style={styles.gridImage} />
                    ) : (
                      <View style={styles.gridImagePlaceholder}>
                        <Text style={styles.gridPlaceholderText}>📝</Text>
                      </View>
                    )}
                    <View style={styles.gridOverlay}>
                      <Text style={styles.gridHandle}>@{item.handle}</Text>
                      <Text style={styles.gridLikes}>⭐ {item.like_count}</Text>
                    </View>
                  </Pressable>
                )
              })}
            </View>
          )
        ) : (
          users.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ fontWeight: '900', fontSize: 16, color: '#9ca3af' }}>No users found</Text>
            </View>
          ) : (
            <View style={styles.userList}>
              {users.map(u => (
                <Pressable key={u.id} style={styles.userCard} onPress={() => router.push(`/profile/${u.id}`)}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarLetter}>
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
  page: { flex: 1, backgroundColor: '#fffdf0' },
  searchHeader: { padding: 16, backgroundColor: '#ffffff', borderBottomWidth: 3, borderBottomColor: '#000' },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  modeTab: {
    flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6,
    backgroundColor: '#f3f4f6', borderWidth: 2, borderColor: '#000',
  },
  modeTabActive: { backgroundColor: '#000' },
  modeTabText: { fontSize: 12, fontWeight: '900', color: '#000' },
  modeTabTextActive: { color: '#fff' },
  searchInput: {
    backgroundColor: '#f3f4f6', borderWidth: 2, borderColor: '#000', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontWeight: '600', color: '#000',
  },
  scrollContent: { paddingBottom: 110 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginTop: 20, marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#000', letterSpacing: 0.5 },
  clearBtn: {
    fontSize: 12, fontWeight: '900', color: '#000', backgroundColor: '#e5e7eb',
    paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1.5, borderColor: '#000', borderRadius: 4,
  },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 12,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%', height: 180, backgroundColor: '#ffffff', borderRadius: 8,
    borderWidth: 2.5, borderColor: '#000', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
    marginBottom: 4,
  },
  gridImage: { width: '100%', height: '100%' },
  gridImagePlaceholder: {
    width: '100%', height: '100%', backgroundColor: '#f3f4f6',
    alignItems: 'center', justifyContent: 'center',
  },
  gridPlaceholderText: { fontSize: 32 },
  gridOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.95)',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 6, borderTopWidth: 2, borderTopColor: '#000',
  },
  gridHandle: { fontSize: 11, fontWeight: '900', color: '#000' },
  gridLikes: { fontSize: 11, fontWeight: '900', color: '#000' },
  userList: { paddingHorizontal: 16, gap: 10 },
  userCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#ffffff', borderRadius: 8, padding: 14,
    borderWidth: 2, borderColor: '#000',
    shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 2,
  },
  userAvatar: {
    width: 48, height: 48, borderRadius: 6, backgroundColor: '#ffe600',
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#000',
  },
  userAvatarLetter: { fontSize: 20, fontWeight: '900', color: '#000' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '900', color: '#000' },
  userHandle: { fontSize: 12, fontWeight: '700', color: '#6b7280' },
  userBio: { fontSize: 12, fontWeight: '500', color: '#4b5563', marginTop: 2 },
})
