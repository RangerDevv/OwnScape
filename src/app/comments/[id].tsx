import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { supabase } from '@/lib/supabase'
import { handleError } from '@/lib/errors'
import { createNotification } from '@/lib/notifications'
import { useAppTheme } from '@/hooks/use-app-theme'
import { CommentSkeleton } from '@/components/skeleton-loader'
import UserAvatar from '@/components/user-avatar'
import type { DbComment, DbPost, DbUser } from '@/lib/database.types'

type CommentWithAuthor = DbComment & { author: Pick<DbUser, 'user_name' | 'user_handle' | 'avatar_url'> | null }

export default function CommentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { colors } = useAppTheme()
  const [post, setPost] = useState<DbPost | null>(null)
  const [comments, setComments] = useState<CommentWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
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
          let userMap: Record<string, { user_name: string | null; user_handle: string; avatar_url: string | null }> = {}

          if (authorIds.length > 0) {
            const { data: users } = await supabase
              .from('Users')
              .select('id, user_name, user_handle, avatar_url')
              .in('id', authorIds)
            if (users) {
              for (const u of users) userMap[u.id] = { user_name: u.user_name, user_handle: u.user_handle, avatar_url: u.avatar_url }
            }
          }

          setComments(rows.map(c => ({
            ...c,
            author: userMap[c.author_id] || null,
          })) as CommentWithAuthor[])
        }
      } catch (e) {
        handleError(e, 'fetchComments')
      }
      setLoading(false)
    })()
  }, [id])

  const handleSubmit = async () => {
    if (!text.trim() || !id) return
    setSubmitting(true)
    try {
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
          .select('user_name, user_handle, avatar_url')
          .eq('id', newComment.author_id)
          .single()
        setComments(prev => [...prev, { ...newComment, author: authorData || null }] as CommentWithAuthor[])
        setText('')
        if (post) {
          await createNotification({
            recipientId: post.author_id,
            actorId: user.id,
            type: 'comment',
            postId: Number(id),
          })
        }
      }
    } catch (e) {
      handleError(e, 'submitComment')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <View style={[styles.page, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={[styles.backBtn, { backgroundColor: colors.grayLight, borderColor: colors.border }]}>
            <Text style={[styles.backBtnText, { color: colors.text }]}>← BACK</Text>
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>COMMENTS</Text>
          <View style={{ width: 60 }} />
        </View>
        <CommentSkeleton />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={[styles.page, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.grayLight, borderColor: colors.border }]}>
          <Text style={[styles.backBtnText, { color: colors.text }]}>← BACK</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>COMMENTS</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {post && (
          <Pressable style={[styles.postPreview, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push(`/post/${post.id}`)}>
            <Text style={[styles.postHandle, { color: colors.pink }]}>@{post.handle}</Text>
            <Text style={[styles.postDesc, { color: colors.text }]}>{post.description}</Text>
            <Text style={[styles.postMeta, { color: colors.textSecondary }]}>⭐ {post.like_count} · ✈️ {post.share_count}</Text>
          </Pressable>
        )}

        {comments.length === 0 && (
          <View style={{ padding: 50, alignItems: 'center' }}>
            <Text style={{ fontSize: 36, marginBottom: 12 }}>💬</Text>
            <Text style={{ fontWeight: '900', fontSize: 16, color: colors.textSecondary }}>No comments yet</Text>
            <Text style={{ marginTop: 4, color: colors.textSecondary, fontWeight: '600', fontSize: 13 }}>Be the first to comment</Text>
          </View>
        )}

        {comments.map(c => (
          <View key={c.id} style={[styles.commentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.commentHeader}>
              <UserAvatar
                avatarUrl={c.author?.avatar_url}
                name={c.author?.user_name}
                handle={c.author?.user_handle}
                size={36}
                borderColor={colors.border}
              />
              <View>
                <Text style={[styles.commentAuthor, { color: colors.text }]}>{c.author?.user_name || 'Unknown'}</Text>
                <Text style={[styles.commentHandle, { color: colors.textSecondary }]}>@{c.author?.user_handle || 'user'}</Text>
              </View>
            </View>
            <Text style={[styles.commentBody, { color: colors.text }]}>{c.comment_body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TextInput style={[styles.input, { backgroundColor: colors.grayLight, borderColor: colors.border, color: colors.text }]} value={text} onChangeText={setText}
          placeholder="Write a comment..." placeholderTextColor={colors.textSecondary} multiline />
        <Pressable style={[styles.sendBtn, { backgroundColor: colors.yellow, borderColor: colors.border }]} onPress={handleSubmit} disabled={submitting || !text.trim()}>
          <Text style={[styles.sendBtnText, { color: colors.text }]}>{submitting ? '...' : '→'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1 },
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
  headerTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  scrollContent: { padding: 16, paddingBottom: 20 },
  postPreview: {
    borderRadius: 8, padding: 14,
    borderWidth: 2, marginBottom: 20,
    boxShadow: '3px 3px 0px rgba(0,0,0,0.3)', elevation: 3,
  },
  postHandle: { fontSize: 12, fontWeight: '900', marginTop: 4 },
  postDesc: { fontSize: 14, fontWeight: '600' },
  postMeta: { fontSize: 11, fontWeight: '700', marginTop: 6 },
  commentCard: {
    borderRadius: 8, padding: 14,
    borderWidth: 2, marginBottom: 12,
    boxShadow: '2px 2px 0px rgba(0,0,0,0.3)', elevation: 2,
  },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },

  commentAuthor: { fontSize: 13, fontWeight: '900' },
  commentHandle: { fontSize: 10, fontWeight: '700' },
  commentBody: { fontSize: 14, fontWeight: '500' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 12, borderTopWidth: 3,
  },
  input: {
    flex: 1, borderWidth: 2, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, maxHeight: 80,
    fontSize: 13, fontWeight: '600',
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
    boxShadow: '2px 2px 0px #000', elevation: 2,
  },
  sendBtnText: { fontSize: 18, fontWeight: '900' },
})
