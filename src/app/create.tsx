import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { supabase } from '../../lib/supabase'
import { pickImages, uploadImage } from '../../lib/storage'

export default function CreatePostScreen() {
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [imageUris, setImageUris] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handlePickImages = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const assets = await pickImages()
    const urls: string[] = []
    for (const asset of assets) {
      const url = await uploadImage(asset, user.id)
      if (url) urls.push(url)
    }
    setImageUris(prev => [...prev, ...urls])
  }

  const removeImage = (index: number) => {
    setImageUris(prev => prev.filter((_, i) => i !== index))
  }

  const handleCreate = async () => {
    if (!description.trim()) { setError('Add a description'); return }
    setError('')
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not logged in'); setSubmitting(false); return }

    const { data: profile } = await supabase
      .from('Users')
      .select('user_handle')
      .eq('id', user.id)
      .single()
    const resolvedHandle = profile?.user_handle || user.email?.split('@')[0] || 'user'

    const { error: insertErr } = await supabase.from('Posts').insert({
      description: description.trim(),
      storage_key: imageUris.length > 0 ? JSON.stringify(imageUris) : null,
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
          <Pressable style={styles.imagePickerBtn} onPress={handlePickImages}>
            <Text style={styles.imagePickerBtnText}>📷 ADD IMAGES ({imageUris.length}/10)</Text>
          </Pressable>

          {imageUris.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
              {imageUris.map((uri, i) => (
                <View key={i} style={styles.thumbWrap}>
                  <Image source={{ uri }} style={styles.thumb} />
                  <Pressable style={styles.removeBtn} onPress={() => removeImage(i)}>
                    <Text style={styles.removeBtnText}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}

          <Text style={styles.label}>CAPTION</Text>
          <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription}
            placeholder="What's on your mind?" placeholderTextColor="#9ca3af" multiline />

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <Pressable style={styles.submitBtn} onPress={handleCreate} disabled={submitting}>
            <Text style={styles.submitBtnText}>{submitting ? 'PUBLISHING...' : 'PUBLISH POST'}</Text>
          </Pressable>
        </View>
      </ScrollView>

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
    borderBottomWidth: 3, borderBottomColor: '#000',
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
  imagePickerBtn: {
    backgroundColor: '#f3f4f6', borderWidth: 2, borderColor: '#000', borderStyle: 'dashed',
    borderRadius: 8, paddingVertical: 28, alignItems: 'center', marginBottom: 12,
  },
  imagePickerBtnText: { fontSize: 16, fontWeight: '900', color: '#6b7280' },
  thumbRow: { marginBottom: 12 },
  thumbWrap: { position: 'relative', marginRight: 8 },
  thumb: { width: 80, height: 80, borderRadius: 6, borderWidth: 2, borderColor: '#000' },
  removeBtn: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: '#dc2626', borderRadius: 12, width: 22, height: 22,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#000',
  },
  removeBtnText: { color: '#fff', fontSize: 11, fontWeight: '900' },
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
