import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { supabase } from '../../../lib/supabase'
import type { DbComment, DbPost, DbUser } from '../../../lib/database.types'

type CommentWithAuthor = DbComment & { author: Pick<DbUser, 'user_name' | 'user_handle'> | null }

export default function CommentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [post, setPost] = useState<DbPost | null>(null)
  const [comments, setComments] = useState<CommentWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      const postNum = Number(id)
      const { data: postData } = await supabase.from('Posts').select('*').eq('id', postNum).single()
      if (postData) setPost(postData)

      const { data: commentRows } = await supabase
        .from('Comments')
        .select('*')
        .eq('post_id', postNum)
        .order('created_at', { ascending: true })

      if (commentRows) {
        const rows = commentRows as DbComment[]
        const authorIds = [...new Set(rows.map(r => r.author_id).filter(Boolean))]
        let userMap: Record<string, { user_name: string | null; user_handle: string }> = {}

        if (authorIds.length > 0) {
          const { data: users } = await supabase
            .from('Users')
            .select('id, user_name, user_handle')
            .in('id', authorIds)
          if (users) {
            for (const u of users) {
              userMap[u.id] = { user_name: u.user_name, user_handle: u.user_handle }
            }
          }
        }

        setComments(rows.map(c => ({
          ...c,
          author: userMap[c.author_id] || null,
        })) as CommentWithAuthor[])
      }

      setLoading(false)
    })()
  }, [id])

  const handleSubmit = async () => {
    if (!text.trim() || !id) return
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSubmitting(false); return }

    const { data, error } = await supabase
      .from('Comments')
      .insert({ comment_body: text.trim(), post_id: Number(id), author_id: user.id })
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
        <Text style={styles.headerTitle}>COMMENTS</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {post && (
          <View style={styles.postPreview}>
            <Text style={styles.postHandle}>@{post.handle}</Text>
            <Text style={styles.postDesc}>{post.description}</Text>
            <Text style={styles.postMeta}>⭐ {post.like_count} · ✈️ {post.share_count}</Text>
          </View>
        )}

        {comments.length === 0 && (
          <View style={{ padding: 40, alignItems: 'center' }}>
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
  scrollContent: { padding: 16, paddingBottom: 100 },
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
    position: 'absolute', bottom: 0, left: 0, right: 0,
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
