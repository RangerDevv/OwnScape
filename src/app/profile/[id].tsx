import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { supabase } from '@/lib/supabase'
import { parseUrls } from '@/lib/storage'
import BottomNav from '@/components/bottom-nav'
import type { DbPost, DbUser } from '@/lib/database.types'

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [profile, setProfile] = useState<DbUser | null>(null)
  const [posts, setPosts] = useState<DbPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      const { data: userData } = await supabase
        .from('Users')
        .select('*')
        .eq('id', id)
        .single()
      if (userData) setProfile(userData)

      const { data: userPosts } = await supabase
        .from('Posts')
        .select('*')
        .eq('author_id', id)
        .order('created_at', { ascending: false })
        .limit(20)
      if (userPosts) setPosts(userPosts as DbPost[])

      setLoading(false)
    })()
  }, [id])

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fffdf0' }}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    )
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← BACK</Text>
        </Pressable>
        <Text style={styles.headerTitle}>PROFILE</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.user_name || profile?.user_handle || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{profile?.user_name || 'Unnamed'}</Text>
          <Text style={styles.handle}>@{profile?.user_handle}</Text>
          {profile?.user_bio && <Text style={styles.bio}>{profile.user_bio}</Text>}
          {!profile?.user_bio && <Text style={styles.bioMuted}>No bio yet</Text>}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.following_count ?? 0}</Text>
              <Text style={styles.statLabel}>FOLLOWING</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile?.follower_count ?? 0}</Text>
              <Text style={styles.statLabel}>FOLLOWERS</Text>
            </View>
          </View>
        </View>

        <Text style={styles.postsSectionTitle}>POSTS ({posts.length})</Text>

        {posts.length === 0 && (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ fontWeight: '600', color: '#9ca3af' }}>No posts yet</Text>
          </View>
        )}

        {posts.map(post => {
          const images = parseUrls(post.storage_key)
          return (
          <View key={post.id} style={styles.postCard}>
            {images.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
                {images.map((url, i) => (
                  <Image key={i} source={{ uri: url }} style={styles.postImage} resizeMode="cover" />
                ))}
              </ScrollView>
            )}
            {!!post.description && <Text style={styles.postDesc}>{post.description}</Text>}
            <View style={styles.postMeta}>
              <Text style={styles.postMetaText}>⭐ {post.like_count}</Text>
              <Text style={styles.postMetaText}>✈️ {post.share_count}</Text>
            </View>
          </View>
          )
        })}
      </ScrollView>

      <BottomNav active="explore" />
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fffdf0' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#ffffff',
    borderBottomWidth: 3, borderBottomColor: '#000',
  },
  backBtn: {
    paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#f3f4f6',
    borderWidth: 2, borderColor: '#000', borderRadius: 6,
  },
  backBtnText: { fontSize: 12, fontWeight: '900', color: '#000' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#000', letterSpacing: 1 },
  card: {
    backgroundColor: '#ffffff', borderRadius: 12, padding: 24, margin: 16,
    borderWidth: 3, borderColor: '#000', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 8, backgroundColor: '#ffe600',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#000',
    shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0,
  },
  avatarText: { color: '#000', fontSize: 28, fontWeight: '900' },
  name: { marginTop: 16, fontSize: 22, fontWeight: '900', color: '#000' },
  handle: {
    marginTop: 2, color: '#000', fontSize: 14, fontWeight: '700',
    backgroundColor: '#e5e7eb', paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1.5, borderColor: '#000',
  },
  bio: { marginTop: 12, fontSize: 14, fontWeight: '500', color: '#4b5563', textAlign: 'center' },
  bioMuted: { marginTop: 12, fontSize: 13, fontWeight: '600', color: '#9ca3af', fontStyle: 'italic' },
  statsRow: { marginTop: 24, width: '100%', flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  statItem: {
    flex: 1, alignItems: 'center', backgroundColor: '#f3f4f6',
    borderWidth: 2, borderColor: '#000', borderRadius: 8, paddingVertical: 12,
  },
  statValue: { fontSize: 20, fontWeight: '900', color: '#000' },
  statLabel: { marginTop: 2, color: '#000', fontSize: 11, fontWeight: '800' },
  postsSectionTitle: {
    fontSize: 16, fontWeight: '900', color: '#000', marginTop: 12, marginBottom: 12,
    paddingHorizontal: 16, letterSpacing: 0.5,
  },
  postCard: {
    backgroundColor: '#ffffff', borderRadius: 10, padding: 12, marginHorizontal: 16, marginBottom: 14,
    borderWidth: 2, borderColor: '#000',
    shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  imageRow: { marginBottom: 8, borderRadius: 6, overflow: 'hidden' },
  postImage: { width: 200, height: 160, borderRadius: 6, marginRight: 6, borderWidth: 2, borderColor: '#000' },
  postDesc: { fontSize: 13, fontWeight: '600', color: '#1f2937', marginBottom: 8 },
  postMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  postMetaText: { fontSize: 12, fontWeight: '800', color: '#6b7280' },
})
