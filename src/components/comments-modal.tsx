import { useEffect, useState } from 'react'
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native'
import { supabase } from '@/lib/supabase'
import type { DbComment, DbPost, DbUser } from '@/lib/database.types'

type CommentWithAuthor = DbComment & { author: Pick<DbUser, 'user_name' | 'user_handle'> | null }

type Props = {
  postId: number
  visible: boolean
  onClose: () => void
}

export default function CommentsModal({ postId, visible, onClose }: Props) {
  const [post, setPost] = useState<DbPost | null>(null)
  const [comments, setComments] = useState<CommentWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!visible || !postId) return
    setLoading(true)
    ;(async () => {
      const [postResult, commentResult] = await Promise.all([
        supabase.from('Posts').select('*').eq('id', postId).single(),
        supabase.from('Comments').select('*').eq('post_id', postId).order('created_at', { ascending: true }),
      ])

      if (postResult.data) setPost(postResult.data)

      const rows = (commentResult.data || []) as DbComment[]
      const authorIds = [...new Set(rows.map(r => r.author_id).filter(Boolean))]
      let userMap: Record<string, { user_name: string | null; user_handle: string }> = {}
      if (authorIds.length > 0) {
        const { data: users } = await supabase
          .from('Users')
          .select('id, user_name, user_handle')
          .in('id', authorIds)
        if (users) {
          for (const u of users) userMap[u.id] = { user_name: u.user_name, user_handle: u.user_handle }
        }
      }
      setComments(rows.map(c => ({ ...c, author: userMap[c.author_id] || null })) as CommentWithAuthor[])
      setLoading(false)
    })()
  }, [postId, visible])

  const handleSubmit = async () => {
    if (!text.trim()) return
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSubmitting(false); return }

    const { data, error } = await supabase
      .from('Comments')
      .insert({ comment_body: text.trim(), post_id: postId, author_id: user.id })
      .select('*')
      .single()

    if (!error && data) {
      const newComment = data as DbComment
      const { data: authorData } = await supabase
        .from('Users')
        .select('user_name, user_handle')
        .eq('id', newComment.author_id)
        .single()
      setComments(prev => [...prev, { ...newComment, author: authorData || null }] as CommentWithAuthor[])
      setText('')
    }
    setSubmitting(false)
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouch} onPress={onClose} />
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.headerTitle}>COMMENTS</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#111827" />
            </View>
          ) : (
            <>
              <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {post && (
                  <View style={styles.postPreview}>
                    <Text style={styles.postHandle}>@{post.handle}</Text>
                    <Text style={styles.postDesc}>{post.description}</Text>
                    <Text style={styles.postMeta}>⭐ {post.like_count} · ✈️ {post.share_count}</Text>
                  </View>
                )}

                {comments.length === 0 && (
                  <View style={{ padding: 30, alignItems: 'center' }}>
                    <Text style={{ fontWeight: '900', color: '#9ca3af' }}>No comments yet</Text>
                    <Text style={{ fontWeight: '600', color: '#9ca3af', fontSize: 13 }}>Be the first to comment</Text>
                  </View>
                )}

                {comments.map(c => (
                  <View key={c.id} style={styles.commentCard}>
                    <View style={styles.commentHeader}>
                      <View style={styles.commentAvatar}>
                        <Text style={styles.commentAvatarLetter}>
                          {(c.author?.user_name || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.commentAuthor}>{c.author?.user_name || 'Unknown'}</Text>
                        <Text style={styles.commentHandle}>@{c.author?.user_handle || 'user'}</Text>
                      </View>
                    </View>
                    <Text style={styles.commentBody}>{c.comment_body}</Text>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.inputBar}>
                <TextInput style={styles.input} value={text} onChangeText={setText}
                  placeholder="Write a comment..." placeholderTextColor="#6b7280" multiline />
                <Pressable style={styles.sendBtn} onPress={handleSubmit} disabled={submitting || !text.trim()}>
                  <Text style={styles.sendBtnText}>{submitting ? '...' : '→'}</Text>
                </Pressable>
              </View>
            </>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backdropTouch: { flex: 1 },
  container: {
    backgroundColor: '#fffdf0', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderTopWidth: 3, borderLeftWidth: 3, borderRightWidth: 3, borderColor: '#000',
    maxHeight: '85%', minHeight: 300,
  },
  handle: {
    width: 40, height: 4, backgroundColor: '#d1d5db', borderRadius: 2,
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: '#000',
  },
  headerTitle: { fontSize: 16, fontWeight: '900', color: '#000', letterSpacing: 0.5 },
  closeBtn: {
    position: 'absolute', right: 12,
    width: 30, height: 30, borderRadius: 6, backgroundColor: '#e5e7eb',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#000',
  },
  closeBtnText: { fontSize: 12, fontWeight: '900', color: '#000' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollArea: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 20 },
  postPreview: {
    backgroundColor: '#ffffff', borderRadius: 8, padding: 14,
    borderWidth: 2, borderColor: '#000', marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.3, shadowRadius: 0, elevation: 3,
  },
  postHandle: { fontSize: 12, fontWeight: '900', color: '#ff70a6' },
  postDesc: { fontSize: 14, fontWeight: '600', color: '#1f2937', marginTop: 4 },
  postMeta: { fontSize: 11, fontWeight: '700', color: '#6b7280', marginTop: 6 },
  commentCard: {
    backgroundColor: '#ffffff', borderRadius: 8, padding: 14,
    borderWidth: 2, borderColor: '#000', marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 0.3, shadowRadius: 0, elevation: 2,
  },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  commentAvatar: {
    width: 32, height: 32, borderRadius: 6, backgroundColor: '#e5e7eb',
    borderWidth: 1.5, borderColor: '#000', alignItems: 'center', justifyContent: 'center',
  },
  commentAvatarLetter: { fontSize: 14, fontWeight: '900', color: '#000' },
  commentAuthor: { fontSize: 13, fontWeight: '900', color: '#000' },
  commentHandle: { fontSize: 10, fontWeight: '700', color: '#6b7280' },
  commentBody: { fontSize: 14, fontWeight: '500', color: '#374151' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 12, backgroundColor: '#ffffff', borderTopWidth: 3, borderTopColor: '#000',
  },
  input: {
    flex: 1, backgroundColor: '#f3f4f6', borderWidth: 2, borderColor: '#000', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, maxHeight: 80,
    fontSize: 13, fontWeight: '600', color: '#000',
  },
  sendBtn: {
    width: 42, height: 42, backgroundColor: '#ffe600', borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#000',
    shadowColor: '#000', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 2,
  },
  sendBtnText: { fontSize: 18, fontWeight: '900', color: '#000' },
})
