import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable,
  ScrollView, StyleSheet, Text, View,
} from 'react-native'
import { supabase } from '@/lib/supabase'
import { handleError } from '@/lib/errors'
import { createNotification } from '@/lib/notifications'
import { processMentions } from '@/lib/mentions'
import { useAppTheme } from '@/hooks/use-app-theme'
import { RichText } from '@/components/rich-text'
import { MentionInput } from '@/components/mention-input'
import UserAvatar from '@/components/user-avatar'
import type { DbComment, DbPost, DbUser } from '@/lib/database.types'

type CommentWithAuthor = DbComment & { author: Pick<DbUser, 'user_name' | 'user_handle' | 'avatar_url'> | null }

type Props = {
  postId: number
  visible: boolean
  onClose: () => void
}

export default function CommentsModal({ postId, visible, onClose }: Props) {
  const router = useRouter()
  const { colors } = useAppTheme()
  const [post, setPost] = useState<DbPost | null>(null)
  const [comments, setComments] = useState<CommentWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!visible || !postId) return
    setLoading(true)
    ;(async () => {
      try {
        const [postResult, commentResult] = await Promise.all([
          supabase.from('Posts').select('*').eq('id', postId).single(),
          supabase.from('Comments').select('*').eq('post_id', postId).order('created_at', { ascending: true }),
        ])

        if (postResult.data) setPost(postResult.data)

        const rows = (commentResult.data || []) as DbComment[]
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
        setComments(rows.map(c => ({ ...c, author: userMap[c.author_id] || null })) as CommentWithAuthor[])
      } catch (e) {
        handleError(e, 'loadComments')
      }
      setLoading(false)
    })()
  }, [postId, visible])

  const handleSubmit = async () => {
    if (!text.trim()) return
    setSubmitting(true)
    try {
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
          .select('user_name, user_handle, avatar_url')
          .eq('id', newComment.author_id)
          .single()
        setComments(prev => [...prev, { ...newComment, author: authorData || null }] as CommentWithAuthor[])
        await processMentions(text.trim(), user.id, postId, newComment.id)
        setText('')
        if (post) {
          await createNotification({
            recipientId: post.author_id,
            actorId: user.id,
            type: 'comment',
            postId,
          })
        }
      }
    } catch (e) {
      handleError(e, 'submitComment')
    }
    setSubmitting(false)
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <Pressable style={styles.backdropTouch} onPress={onClose} />
        <KeyboardAvoidingView
          style={[styles.container, { backgroundColor: colors.background, borderColor: colors.border }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.handle, { backgroundColor: colors.gray }]} />
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>COMMENTS</Text>
            <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.gray, borderColor: colors.border }]}>
              <Text style={[styles.closeBtnText, { color: colors.text }]}>✕</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.loading} />
            </View>
          ) : (
            <>
              <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {post && (
                  <Pressable style={[styles.postPreview, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => { onClose(); router.push(`/post/${post.id}`) }}>
                    <Text style={[styles.postHandle, { color: colors.pink }]}>@{post.handle}</Text>
                    <RichText text={post.description} style={[styles.postDesc, { color: colors.text }]} hashtagStyle={{ color: colors.pink }} mentionStyle={{ color: colors.pink }} />
                    <Text style={[styles.postMeta, { color: colors.textSecondary }]}>⭐ {post.like_count} · ✈️ {post.share_count}</Text>
                  </Pressable>
                )}

                {comments.length === 0 && (
                  <View style={{ padding: 30, alignItems: 'center' }}>
                    <Text style={{ fontWeight: '900', color: colors.textSecondary }}>No comments yet</Text>
                    <Text style={{ fontWeight: '600', color: colors.textSecondary, fontSize: 13 }}>Be the first to comment</Text>
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
                    <RichText
                      text={c.comment_body}
                      style={[styles.commentBody, { color: colors.text }]}
                      hashtagStyle={{ color: colors.pink }}
                      mentionStyle={{ color: colors.pink }}
                      onHashtagPress={(tag) => { onClose(); router.push(`/explore?tag=${encodeURIComponent(tag.slice(1))}`) }}
                      onMentionPress={(handle) => { onClose(); router.push(`/explore?q=${encodeURIComponent(handle.slice(1))}&mode=users`) }}
                    />
                  </View>
                ))}
              </ScrollView>

              <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                <MentionInput
                  style={[styles.input, { backgroundColor: colors.grayLight, borderColor: colors.border, color: colors.text }]}
                  value={text}
                  onChangeText={setText}
                  placeholder="Write a comment..." placeholderTextColor={colors.textSecondary} multiline
                />
                <Pressable style={[styles.sendBtn, { backgroundColor: colors.yellow, borderColor: colors.border }]} onPress={handleSubmit} disabled={submitting || !text.trim()}>
                  <Text style={[styles.sendBtnText, { color: colors.text }]}>{submitting ? '...' : '→'}</Text>
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
    flex: 1, justifyContent: 'flex-end',
  },
  backdropTouch: { flex: 1 },
  container: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderTopWidth: 3, borderLeftWidth: 3, borderRightWidth: 3,
    maxHeight: '85%', minHeight: 300,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 2,
  },
  headerTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  closeBtn: {
    position: 'absolute', right: 12,
    width: 30, height: 30, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
  },
  closeBtnText: { fontSize: 12, fontWeight: '900' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollArea: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 20 },
  postPreview: {
    borderRadius: 8, padding: 14,
    borderWidth: 2, marginBottom: 20,
    boxShadow: '3px 3px 0px rgba(0,0,0,0.3)', elevation: 3,
  },
  postHandle: { fontSize: 12, fontWeight: '900' },
  postDesc: { fontSize: 14, fontWeight: '600', marginTop: 4 },
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
