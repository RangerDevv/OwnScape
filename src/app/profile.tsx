import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { supabase } from '../../lib/supabase'
import type { DbUser } from '../../lib/database.types'

export default function ProfileScreen() {
  const router = useRouter()
  const [profile, setProfile] = useState<DbUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editHandle, setEditHandle] = useState('')
  const [saving, setSaving] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data, error } = await supabase
      .from('Users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!error && data) {
      setProfile(data)
      setEditName(data.user_name || '')
      setEditBio(data.user_bio || '')
      setEditHandle(data.user_handle || '')
    }
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
        </View>
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
