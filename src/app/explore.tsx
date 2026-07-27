import { useEffect, useState } from 'react'
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { supabase } from '@/lib/supabase'
import { parseUrls } from '@/lib/storage'
import BottomNav from '@/components/bottom-nav'
import CommentsModal from '@/components/comments-modal'
import type { DbPost } from '@/lib/database.types'

type TrendingPost = DbPost & { images: string[] }

export default function ExploreScreen() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TrendingPost[]>([])
  const [loading, setLoading] = useState(true)
  const [searched, setSearched] = useState(false)
  const [commentPostId, setCommentPostId] = useState<number | null>(null)

  const fetchTrending = async (search?: string) => {
    setLoading(true)
    setSearched(!!search)

    let dbQuery = supabase
      .from('Posts')
      .select('*')
      .order('like_count', { ascending: false })
      .limit(20)

    if (search) {
      dbQuery = dbQuery.ilike('description', `%${search}%`)
    }

    const { data } = await dbQuery
    if (data) {
      setResults(
        (data as DbPost[]).map(p => ({ ...p, images: parseUrls(p.storage_key) }))
      )
    }
    setLoading(false)
  }

  useEffect(() => { fetchTrending() }, [])

  const handleSearch = () => {
    fetchTrending(query.trim() || undefined)
  }

  return (
    <View style={styles.page}>
      <View style={styles.searchHeader}>
        <TextInput
          placeholder="Search posts by description..."
          placeholderTextColor="#6b7280"
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{searched ? 'SEARCH RESULTS' : 'TRENDING'}</Text>
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
        ) : results.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ fontWeight: '900', fontSize: 16, color: '#9ca3af' }}>No posts found</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {results.map(item => {
              const thumb = item.images[0]
              return (
                <Pressable
                  key={item.id}
                  style={styles.gridItem}
                  onPress={() => setCommentPostId(item.id)}
                >
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
})
