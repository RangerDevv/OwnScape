import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { supabase } from '../../lib/supabase'
import { parseUrls } from '../../lib/storage'
import type { DbPost, DbUser } from '../../lib/database.types'

export default function ProfileScreen() {
  const router = useRouter()
  const [profile, setProfile] = useState<DbUser | null>(null)
  const [myPosts, setMyPosts] = useState<DbPost[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editHandle, setEditHandle] = useState('')
  const [saving, setSaving] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    let { data, error } = await supabase
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
      setEditName(data.user_name || '')
      setEditBio(data.user_bio || '')
      setEditHandle(data.user_handle || '')
    }

    const { data: posts } = await supabase
      .from('Posts')
      .select('*')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })
    if (posts) setMyPosts(posts as DbPost[])

    setLoading(false)
  }

  useEffect(() => { fetchProfile() }, [])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    const { error } = await supabase
      .from('Users')
      .update({
        user_name: editName.trim() || null,
        user_bio: editBio.trim() || null,
        user_handle: editHandle.trim(),
      })
      .eq('id', profile.id)

    if (!error) {
      setProfile(prev => prev ? { ...prev, user_name: editName.trim() || null, user_bio: editBio.trim() || null, user_handle: editHandle.trim() } : prev)
    }
    setSaving(false)
    setEditing(false)
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await supabase.auth.signOut()
    setIsSigningOut(false)
    router.replace('/')
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your profile, posts, and comments. This cannot be undone.',
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'DELETE EVERYTHING',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            await supabase.from('Comments').delete().eq('author_id', user.id)
            await supabase.from('Posts').delete().eq('author_id', user.id)
            await supabase.from('Users').delete().eq('id', user.id)

            await supabase.auth.signOut()
            setDeleting(false)
            router.replace('/')
          },
        },
      ]
    )
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
      <Text style={styles.headerTitle}>PROFILE</Text>

      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.user_name || profile?.user_handle || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>

          {editing ? (
            <>
              <TextInput style={styles.editInput} value={editName} onChangeText={setEditName}
                placeholder="Display Name" placeholderTextColor="#9ca3af" />
              <TextInput style={styles.editInput} value={editHandle} onChangeText={setEditHandle}
                placeholder="Username" placeholderTextColor="#9ca3af" autoCapitalize="none" />
              <TextInput style={[styles.editInput, { height: 80, textAlignVertical: 'top' }]}
                value={editBio} onChangeText={setEditBio} placeholder="Bio" placeholderTextColor="#9ca3af" multiline />
              <View style={styles.editActions}>
                <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                  <Text style={styles.saveBtnText}>{saving ? 'SAVING...' : 'SAVE'}</Text>
                </Pressable>
                <Pressable style={styles.cancelBtn} onPress={() => setEditing(false)}>
                  <Text style={styles.cancelBtnText}>CANCEL</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
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
                {profile?.isPublic !== undefined && (
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{profile.isPublic ? '✓' : '✗'}</Text>
                    <Text style={styles.statLabel}>PUBLIC</Text>
                  </View>
                )}
              </View>

              <Pressable style={styles.editProfileBtn} onPress={() => setEditing(true)}>
                <Text style={styles.editProfileBtnText}>EDIT PROFILE</Text>
              </Pressable>
            </>
          )}

          <Pressable style={styles.signOutBtn} onPress={handleSignOut} disabled={isSigningOut}>
            <Text style={styles.signOutBtnText}>{isSigningOut ? 'SIGNING OUT...' : 'SIGN OUT'}</Text>
          </Pressable>

          <Pressable style={styles.deleteAccountBtn} onPress={handleDeleteAccount} disabled={deleting}>
            <Text style={styles.deleteAccountBtnText}>{deleting ? 'DELETING...' : 'DELETE ACCOUNT'}</Text>
          </Pressable>
        </View>

        <Text style={styles.postsSectionTitle}>MY POSTS ({myPosts.length})</Text>

        {myPosts.length === 0 && (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ fontWeight: '600', color: '#9ca3af' }}>No posts yet</Text>
          </View>
        )}

        {myPosts.map(post => {
          const images = parseUrls(post.storage_key)
          return (
          <View key={post.id} style={styles.postCard}>
            {images.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.profilePostImages}>
                {images.map((url, i) => (
                  <Image key={i} source={{ uri: url }} style={styles.profilePostImage} resizeMode="cover" />
                ))}
              </ScrollView>
            )}
            {!!post.description && <Text style={styles.postDesc}>{post.description}</Text>}
            <View style={styles.postMeta}>
              <Text style={styles.postMetaText}>⭐ {post.like_count}</Text>
              <Text style={styles.postMetaText}>✈️ {post.share_count}</Text>
              <Pressable onPress={() => {
                setMyPosts(prev => prev.filter(p => p.id !== post.id))
                supabase.from('Posts').delete().eq('id', post.id)
              }} style={styles.deletePostBtn}>
                <Text style={styles.deletePostBtnText}>🗑️</Text>
              </Pressable>
            </View>
          </View>
          )
        })}
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <Pressable style={styles.navItem} onPress={() => router.push('/feed')}>
          <Text style={styles.navIconSymbol}>🏠</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.push('/explore')}>
          <Text style={styles.navIconSymbol}>🔍</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.push('/create')}>
          <Text style={styles.navIconSymbol}>➕</Text>
        </Pressable>
        <Pressable style={styles.navItemActive} onPress={() => router.push('/profile')}>
          <Text style={styles.navIconActiveSymbol}>👤</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fffdf0', paddingTop: 54, paddingHorizontal: 16 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#000', marginBottom: 16, letterSpacing: 1 },
  card: {
    backgroundColor: '#ffffff', borderRadius: 12, padding: 24,
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
  editProfileBtn: {
    marginTop: 20, width: '100%', backgroundColor: '#ffe600',
    borderWidth: 2, borderColor: '#000', borderRadius: 8, paddingVertical: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 2,
  },
  editProfileBtnText: { color: '#000', fontSize: 13, fontWeight: '900' },
  editInput: {
    width: '100%', backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#000', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, marginTop: 12, fontSize: 14, fontWeight: '600', color: '#000',
  },
  editActions: { flexDirection: 'row', gap: 10, marginTop: 16, width: '100%' },
  saveBtn: {
    flex: 1, backgroundColor: '#22c55e', borderRadius: 8, paddingVertical: 12,
    alignItems: 'center', borderWidth: 2, borderColor: '#000',
    shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 2,
  },
  saveBtnText: { color: '#000', fontSize: 13, fontWeight: '900' },
  cancelBtn: {
    flex: 1, backgroundColor: '#e5e7eb', borderRadius: 8, paddingVertical: 12,
    alignItems: 'center', borderWidth: 2, borderColor: '#000',
    shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 2,
  },
  cancelBtnText: { color: '#000', fontSize: 13, fontWeight: '900' },
  signOutBtn: {
    marginTop: 16, width: '100%', backgroundColor: '#ffffff',
    borderWidth: 2, borderColor: '#000', borderRadius: 8, paddingVertical: 12, alignItems: 'center',
  },
  signOutBtnText: { color: '#000', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  deleteAccountBtn: {
    marginTop: 24, width: '100%', backgroundColor: '#fee2e2',
    borderWidth: 2, borderColor: '#dc2626', borderRadius: 8, paddingVertical: 12, alignItems: 'center',
  },
  deleteAccountBtnText: { color: '#dc2626', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  postsSectionTitle: {
    fontSize: 16, fontWeight: '900', color: '#000', marginTop: 28, marginBottom: 12, letterSpacing: 0.5,
  },
  postCard: {
    backgroundColor: '#ffffff', borderRadius: 10, padding: 12, marginBottom: 14,
    borderWidth: 2, borderColor: '#000',
    shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  postImage: { width: '100%', height: 200, borderRadius: 6, marginBottom: 8, borderWidth: 2, borderColor: '#000' },
  postDesc: { fontSize: 13, fontWeight: '600', color: '#1f2937', marginBottom: 8 },
  postMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  postMetaText: { fontSize: 12, fontWeight: '800', color: '#6b7280' },
  deletePostBtn: { marginLeft: 'auto', backgroundColor: '#fee2e2', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1.5, borderColor: '#000' },
  deletePostBtnText: { fontSize: 12 },
  profilePostImages: { marginBottom: 8, borderRadius: 6, overflow: 'hidden' },
  profilePostImage: { width: 200, height: 160, borderRadius: 6, marginRight: 6, borderWidth: 2, borderColor: '#000' },
  bottomNav: {
    position: 'absolute', bottom: 20, left: 20, right: 20, height: 60,
    backgroundColor: '#ffe600', borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 12,
    shadowColor: '#000', shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6,
    borderWidth: 3, borderColor: '#000',
  },
  navItem: {
    width: 42, height: 42, backgroundColor: '#ffffff', borderRadius: 8,
    borderWidth: 2, borderColor: '#000', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 2,
  },
  navItemActive: {
    width: 46, height: 46, backgroundColor: '#000', borderRadius: 8,
    borderWidth: 2, borderColor: '#000', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  navIconSymbol: { fontSize: 18 },
  navIconActiveSymbol: { fontSize: 18, color: '#ffffff' },
})
