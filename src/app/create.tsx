import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { supabase } from '../../lib/supabase'
import { pickAndUploadImage } from '../../lib/storage'

export default function CreatePostScreen() {
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [handle, setHandle] = useState('')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handlePickImage = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const uri = await pickAndUploadImage(user.id)
    if (uri) setImageUri(uri)
  }

  const handleCreate = async () => {
    if (!description.trim()) { setError('Add a description'); return }
    setError('')
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not logged in'); setSubmitting(false); return }

    const resolvedHandle = handle.trim() || user.email?.split('@')[0] || 'user'

    const { error: insertErr } = await supabase.from('Posts').insert({
      description: description.trim(),
      storage_key: imageUri,
      handle: resolvedHandle,
      author_id: user.id,
      like_count: 0,
      share_count: 0,
    })

    setSubmitting(false)
    if (insertErr) { setError(insertErr.message); return }
    router.replace('/feed')
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← BACK</Text>
        </Pressable>
        <Text style={styles.headerTitle}>NEW POST</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          {/* Image picker area */}
          <Pressable style={styles.imagePicker} onPress={handlePickImage}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.pickedImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderIcon}>📷</Text>
                <Text style={styles.imagePlaceholderText}>TAP TO ADD IMAGE</Text>
              </View>
            )}
          </Pressable>
          {imageUri && (
            <Pressable onPress={handlePickImage} style={styles.changeImageBtn}>
              <Text style={styles.changeImageText}>CHANGE IMAGE</Text>
            </Pressable>
          )}

          <Text style={styles.label}>HANDLE</Text>
          <TextInput style={styles.input} value={handle} onChangeText={setHandle}
            placeholder="@yourhandle" placeholderTextColor="#9ca3af" autoCapitalize="none" />

          <Text style={styles.label}>CAPTION</Text>
          <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription}
            placeholder="What's on your mind?" placeholderTextColor="#9ca3af" multiline />

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <Pressable style={styles.submitBtn} onPress={handleCreate} disabled={submitting}>
            <Text style={styles.submitBtnText}>{submitting ? 'PUBLISHING...' : 'PUBLISH POST'}</Text>
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
        <Pressable style={styles.navItemActive} onPress={() => router.push('/create')}>
          <Text style={styles.navIconActiveSymbol}>➕</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.push('/profile')}>
          <Text style={styles.navIconSymbol}>👤</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fffdf0' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#ffffff',
    borderBottomWidth: 3, borderBottomColor: '#000000',
  },
  backBtn: {
    paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#f3f4f6',
    borderWidth: 2, borderColor: '#000', borderRadius: 6,
  },
  backBtnText: { fontSize: 12, fontWeight: '900', color: '#000' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#000', letterSpacing: 1 },
  content: { padding: 16, paddingBottom: 110 },
  card: {
    backgroundColor: '#ffffff', borderRadius: 12, padding: 20,
    borderWidth: 3, borderColor: '#000',
    shadowColor: '#000', shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5,
  },
  imagePicker: {
    width: '100%', height: 220, borderRadius: 8, overflow: 'hidden',
    backgroundColor: '#f3f4f6', borderWidth: 2, borderColor: '#000', borderStyle: 'dashed',
    marginBottom: 12,
  },
  pickedImage: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderIcon: { fontSize: 40 },
  imagePlaceholderText: { fontSize: 13, fontWeight: '900', color: '#6b7280', marginTop: 8 },
  changeImageBtn: { alignItems: 'center', marginBottom: 8 },
  changeImageText: { fontSize: 11, fontWeight: '900', color: '#ff70a6' },
  label: { fontSize: 12, fontWeight: '900', color: '#000', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#000', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, fontWeight: '600', color: '#000',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  errorText: { color: '#dc2626', fontWeight: '700', marginTop: 10 },
  submitBtn: {
    backgroundColor: '#ffe600', borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 20,
    borderWidth: 3, borderColor: '#000',
    shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  submitBtnText: { color: '#000', fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
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
