import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { supabase } from '@/lib/supabase'
import { pickImages, uploadImage } from '@/lib/storage'
import { handleError } from '@/lib/errors'
import { linkHashtags } from '@/lib/hashtags'
import { processMentions } from '@/lib/mentions'
import { useAppTheme } from '@/hooks/use-app-theme'
import BottomNav from '@/components/bottom-nav'
import { MentionInput } from '@/components/mention-input'

export default function CreatePostScreen() {
  const router = useRouter()
  const { colors } = useAppTheme()
  const [description, setDescription] = useState('')
  const [imageUris, setImageUris] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handlePickImages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const assets = await pickImages()
      const urls: string[] = []
      for (const asset of assets) {
        const url = await uploadImage(asset, user.id)
        if (url) urls.push(url)
      }
      setImageUris(prev => [...prev, ...urls])
    } catch (e) {
      handleError(e, 'handlePickImages')
    }
  }

  const removeImage = (index: number) => {
    setImageUris(prev => prev.filter((_, i) => i !== index))
  }

  const handleCreate = async () => {
    if (!description.trim()) { setError('Add a description'); return }
    setError('')
    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Not logged in'); setSubmitting(false); return }

      const { data: profile } = await supabase
        .from('Users')
        .select('user_handle')
        .eq('id', user.id)
        .single()
      const resolvedHandle = profile?.user_handle || user.email?.split('@')[0] || 'user'

      const { error: insertErr, data } = await supabase.from('Posts').insert({
        description: description.trim(),
        storage_key: imageUris.length > 0 ? JSON.stringify(imageUris) : null,
        handle: resolvedHandle,
        author_id: user.id,
        like_count: 0,
        share_count: 0,
      }).select('id')

      if (insertErr) { setError(insertErr.message); setSubmitting(false); return }
      const postId = data?.[0]?.id ?? 0
      await linkHashtags(postId, description.trim())
      await processMentions(description.trim(), user.id, postId)
      router.replace('/feed')
    } catch (e) {
      setError(handleError(e, 'handleCreate'))
    }
    setSubmitting(false)
  }

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.grayLight, borderColor: colors.border }]}>
          <Text style={[styles.backBtnText, { color: colors.text }]}>← BACK</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>NEW POST</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable style={[styles.imagePickerBtn, { backgroundColor: colors.grayLight, borderColor: colors.border }]} onPress={handlePickImages}>
            <Text style={[styles.imagePickerBtnText, { color: colors.textSecondary }]}>📷 ADD IMAGES ({imageUris.length}/10)</Text>
          </Pressable>

          {imageUris.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
              {imageUris.map((uri, i) => (
                <View key={i} style={styles.thumbWrap}>
                  <Image source={{ uri }} style={[styles.thumb, { borderColor: colors.border }]} />
                  <Pressable style={[styles.removeBtn, { backgroundColor: colors.red, borderColor: colors.border }]} onPress={() => removeImage(i)}>
                    <Text style={styles.removeBtnText}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}

          <Text style={[styles.label, { color: colors.text }]}>CAPTION</Text>
          <MentionInput
            value={description}
            onChangeText={setDescription}
            style={[styles.input, styles.textArea, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            placeholder="What's on your mind?" placeholderTextColor={colors.textSecondary} multiline
          />

          {!!error && <Text style={[styles.errorText, { color: colors.red }]}>{error}</Text>}

          <Pressable style={[styles.submitBtn, { backgroundColor: colors.yellow, borderColor: colors.border }]} onPress={handleCreate} disabled={submitting}>
            <Text style={[styles.submitBtnText, { color: colors.text }]}>{submitting ? 'PUBLISHING...' : 'PUBLISH POST'}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <BottomNav active="create" />
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 3,
  },
  backBtn: {
    paddingVertical: 6, paddingHorizontal: 10,
    borderWidth: 2, borderRadius: 6,
  },
  backBtnText: { fontSize: 12, fontWeight: '900' },
  headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  content: { padding: 16, paddingBottom: 110 },
  card: {
    borderRadius: 12, padding: 20,
    borderWidth: 3,
    boxShadow: '5px 5px 0px #000', elevation: 5,
  },
  imagePickerBtn: {
    borderWidth: 2, borderStyle: 'dashed',
    borderRadius: 8, paddingVertical: 28, alignItems: 'center', marginBottom: 12,
  },
  imagePickerBtnText: { fontSize: 16, fontWeight: '900' },
  thumbRow: { marginBottom: 12 },
  thumbWrap: { position: 'relative', marginRight: 8 },
  thumb: { width: 80, height: 80, borderRadius: 6, borderWidth: 2 },
  removeBtn: {
    position: 'absolute', top: -6, right: -6,
    borderRadius: 12, width: 22, height: 22,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
  },
  removeBtnText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  label: { fontSize: 12, fontWeight: '900', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 2, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, fontWeight: '600',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  errorText: { fontWeight: '700', marginTop: 10 },
  submitBtn: {
    borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 20,
    borderWidth: 3,
    boxShadow: '3px 3px 0px #000', elevation: 3,
  },
  submitBtnText: { fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
})
