import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable,
  RefreshControl, ScrollView, Share, StyleSheet, Text, TextInput, View,
} from 'react-native'
import { supabase } from '@/lib/supabase'
import { deleteStorageImages, parseUrls, pickImages, uploadImage } from '@/lib/storage'
import { addLike, getLikedPostIds, removeLike } from '@/lib/likes'
import { handleError } from '@/lib/errors'
import { useAppTheme } from '@/hooks/use-app-theme'
import UserAvatar from '@/components/user-avatar'
import type { DbPost, DbUser } from '@/lib/database.types'

type PostWithAuthor = DbPost & { author: Pick<DbUser, 'user_name' | 'user_handle' | 'avatar_url'> | null }

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { colors } = useAppTheme()
  const [post, setPost] = useState<PostWithAuthor | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [liked, setLiked] = useState(false)
  const [commentCount, setCommentCount] = useState(0)

  const [editing, setEditing] = useState(false)
  const [editDesc, setEditDesc] = useState('')
  const [editImages, setEditImages] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const isAuthor = currentUserId && post?.author_id === currentUserId

  const fetchPost = async () => {
    if (!id) return
    try {
      const postNum = Number(id)
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)

      const { data: postData } = await supabase
        .from('Posts')
        .select('*')
        .eq('id', postNum)
        .single()

      if (postData) {
        const p = postData as DbPost
        let author = null
        const { data: userData } = await supabase
          .from('Users')
          .select('user_name, user_handle, avatar_url')
          .eq('id', p.author_id)
          .single()
        if (userData) author = userData
        setPost({ ...p, author } as PostWithAuthor)
        setEditDesc(p.description)
        setEditImages(parseUrls(p.storage_key))
      }

      if (user) {
        const likedSet = await getLikedPostIds(user.id)
        setLiked(likedSet.has(postNum))
      }

      const { count } = await supabase
        .from('Comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postNum)
      setCommentCount(count ?? 0)
    } catch (e) {
      handleError(e, 'fetchPost')
    }
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { fetchPost() }, [id])

  const onRefresh = () => {
    setRefreshing(true)
    fetchPost()
  }

  const handleLike = async () => {
    if (!currentUserId || !post) return
    const newCount = post.like_count + (liked ? -1 : 1)
    setLiked(!liked)
    setPost(prev => prev ? { ...prev, like_count: newCount } : prev)
    const ok = liked
      ? await removeLike(currentUserId, post.id)
      : await addLike(currentUserId, post.id)
    if (!ok) {
      setLiked(liked)
      setPost(prev => prev ? { ...prev, like_count: post.like_count } : prev)
    }
  }

  const handleShare = async () => {
    if (!post) return
    try {
      await Share.share({ message: `Check out this post by @${post.handle}: "${post.description}" on OwnScape!` })
    } catch {}
  }

  const handleAddImages = async () => {
    if (!currentUserId) return
    try {
      const assets = await pickImages()
      const urls: string[] = []
      for (const asset of assets) {
        const url = await uploadImage(asset, currentUserId)
        if (url) urls.push(url)
      }
      setEditImages(prev => [...prev, ...urls])
    } catch (e) {
      handleError(e, 'handleAddImages')
    }
  }

  const handleRemoveImage = (index: number) => {
    setEditImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!post) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('Posts')
        .update({
          description: editDesc.trim(),
          storage_key: editImages.length > 0 ? JSON.stringify(editImages) : null,
        })
        .eq('id', post.id)
      if (error) {
        handleError(error, 'handleSave')
      } else {
        setPost(prev => prev ? {
          ...prev,
          description: editDesc.trim(),
          storage_key: editImages.length > 0 ? JSON.stringify(editImages) : null,
        } : prev)
        setEditing(false)
      }
    } catch (e) {
      handleError(e, 'handleSave')
    }
    setSaving(false)
  }

  const handleDelete = () => {
    if (!post) return
    Alert.alert('Delete Post', 'This cannot be undone.', [
      { text: 'CANCEL', style: 'cancel' },
      {
        text: 'DELETE',
        style: 'destructive',
        onPress: async () => {
          const images = parseUrls(post.storage_key)
          await Promise.all([
            supabase.from('Posts').delete().eq('id', post.id),
            images.length > 0 ? deleteStorageImages(images) : Promise.resolve(),
          ])
          router.back()
        },
      },
    ])
  }

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime()
    const secs = Math.floor(diff / 1000)
    if (secs < 60) return 'just now'
    const mins = Math.floor(secs / 60)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.loading} />
      </View>
    )
  }

  if (!post) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ fontWeight: '900', fontSize: 16, color: colors.textSecondary }}>Post not found</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: '900', color: colors.text, textDecorationLine: 'underline' }}>Go back</Text>
        </Pressable>
      </View>
    )
  }

  const postImages = parseUrls(post.storage_key)
  const displayImages = editing ? editImages : postImages

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.grayLight, borderColor: colors.border }]}>
          <Text style={[styles.backBtnText, { color: colors.text }]}>← BACK</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>POST</Text>
        {isAuthor && !editing && (
          <Pressable onPress={() => setEditing(true)} style={[styles.editBtn, { backgroundColor: colors.yellow, borderColor: colors.border }]}>
            <Text style={[styles.editBtnText, { color: colors.text }]}>EDIT</Text>
          </Pressable>
        )}
        {isAuthor && editing && (
          <View style={{ width: 60 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text} />}
      >
        <Pressable
          style={[styles.authorRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push(`/profile/${post.author_id}`)}
        >
          <UserAvatar
            avatarUrl={post.author?.avatar_url}
            name={post.author?.user_name}
            handle={post.author?.user_handle || post.handle}
            size={44}
            borderColor={colors.border}
          />
          <View style={styles.authorInfo}>
            <Text style={[styles.authorName, { color: colors.text }]}>{post.author?.user_name || post.handle}</Text>
            <Text style={[styles.authorHandle, { color: colors.textSecondary }]}>@{post.author?.user_handle || post.handle}</Text>
          </View>
          <Text style={[styles.timeBadge, { color: colors.text, backgroundColor: colors.gray, borderColor: colors.border }]}>{timeAgo(post.created_at)}</Text>
        </Pressable>

        {displayImages.length > 0 && (
          <View style={[styles.imageContainer, { borderColor: colors.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} pagingEnabled>
              {displayImages.map((url, i) => (
                <View key={i} style={styles.imageWrap}>
                  <Image source={{ uri: url }} style={styles.postImage} resizeMode="contain" />
                  {editing && (
                    <Pressable style={[styles.removeImgBtn, { backgroundColor: colors.red, borderColor: colors.border }]} onPress={() => handleRemoveImage(i)}>
                      <Text style={[styles.removeImgBtnText, { color: colors.card }]}>✕</Text>
                    </Pressable>
                  )}
                </View>
              ))}
            </ScrollView>
            {displayImages.length > 1 && (
              <Text style={styles.imageCounter}>{displayImages.length} image{displayImages.length > 1 ? 's' : ''}</Text>
            )}
          </View>
        )}

        {editing && (
          <Pressable style={[styles.addImageBtn, { backgroundColor: colors.grayLight, borderColor: colors.border }]} onPress={handleAddImages}>
            <Text style={[styles.addImageBtnText, { color: colors.textSecondary }]}>+ ADD IMAGES</Text>
          </Pressable>
        )}

        {editing ? (
          <TextInput
            style={[styles.editInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
            value={editDesc}
            onChangeText={setEditDesc}
            placeholder="Edit description..."
            placeholderTextColor={colors.textSecondary}
            multiline
          />
        ) : (
          <Text style={[styles.description, { color: colors.text }]}>{post.description}</Text>
        )}

        <View style={styles.statsRow}>
          <View style={[styles.statItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{post.like_count}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>LIKES</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{commentCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>COMMENTS</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{post.share_count}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>SHARES</Text>
          </View>
        </View>

        <View style={[styles.actionBar, { backgroundColor: colors.pink, borderColor: colors.border }]}>
          <Pressable onPress={handleLike} style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.actionIcon}>{liked ? '⭐' : '☆'}</Text>
            <Text style={[styles.actionLabel, { color: colors.text }]}>{liked ? 'LIKED' : 'LIKE'}</Text>
          </Pressable>
          <Pressable onPress={() => router.push(`/comments/${post.id}`)} style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={[styles.actionLabel, { color: colors.text }]}>COMMENT</Text>
          </Pressable>
          <Pressable onPress={handleShare} style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.actionIcon}>✈️</Text>
            <Text style={[styles.actionLabel, { color: colors.text }]}>SHARE</Text>
          </Pressable>
        </View>

        {editing && (
          <View style={styles.editActionsRow}>
            <Pressable style={[styles.saveBtn, { backgroundColor: colors.green, borderColor: colors.border }]} onPress={handleSave} disabled={saving}>
              <Text style={[styles.saveBtnText, { color: colors.text }]}>{saving ? 'SAVING...' : 'SAVE'}</Text>
            </Pressable>
            <Pressable style={[styles.cancelEditBtn, { backgroundColor: colors.gray, borderColor: colors.border }]} onPress={() => {
              setEditing(false)
              setEditDesc(post.description)
              setEditImages(parseUrls(post.storage_key))
            }}>
              <Text style={[styles.cancelEditBtnText, { color: colors.text }]}>CANCEL</Text>
            </Pressable>
          </View>
        )}

        {isAuthor && !editing && (
          <Pressable style={[styles.deleteBtn, { backgroundColor: colors.destructiveBg, borderColor: colors.destructiveBorder }]} onPress={handleDelete}>
            <Text style={[styles.deleteBtnText, { color: colors.red }]}>DELETE POST</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
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
  headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  editBtn: {
    paddingVertical: 6, paddingHorizontal: 12,
    borderWidth: 2, borderRadius: 6,
  },
  editBtnText: { fontSize: 12, fontWeight: '900' },
  scrollContent: { paddingBottom: 40 },
  authorRow: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    marginHorizontal: 16, marginTop: 16, borderRadius: 12,
    borderWidth: 3,
    boxShadow: '4px 4px 0px #000', elevation: 4,
  },

  authorInfo: { marginLeft: 12, flex: 1 },
  authorName: { fontSize: 16, fontWeight: '900' },
  authorHandle: { fontSize: 12, fontWeight: '700', marginTop: 1 },
  timeBadge: {
    fontSize: 11, fontWeight: '700',
    paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1.5, borderRadius: 4,
  },
  imageContainer: {
    marginHorizontal: 16, marginTop: 16, borderRadius: 8,
    borderWidth: 3, overflow: 'hidden',
    backgroundColor: '#000',
  },
  imageWrap: { position: 'relative' },
  postImage: { width: 320, height: 360 },
  removeImgBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
  },
  removeImgBtnText: { fontSize: 13, fontWeight: '900' },
  imageCounter: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4,
    color: '#fff', fontSize: 11, fontWeight: '700',
  },
  addImageBtn: {
    marginHorizontal: 16, marginTop: 12, borderWidth: 2,
    borderStyle: 'dashed', borderRadius: 8, paddingVertical: 14, alignItems: 'center',
  },
  addImageBtnText: { fontSize: 14, fontWeight: '900' },
  description: {
    marginHorizontal: 16, marginTop: 16, fontSize: 16, fontWeight: '600',
    lineHeight: 24,
  },
  editInput: {
    marginHorizontal: 16, marginTop: 16, borderWidth: 2,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontWeight: '600', minHeight: 100, textAlignVertical: 'top',
  },
  statsRow: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: 20, gap: 12,
  },
  statItem: {
    flex: 1, alignItems: 'center', borderWidth: 2,
    borderRadius: 8, paddingVertical: 12,
    boxShadow: '2px 2px 0px #000', elevation: 2,
  },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '800', marginTop: 2 },
  actionBar: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: 16, gap: 10,
    borderRadius: 10, padding: 10,
    borderWidth: 3,
    boxShadow: '4px 4px 0px #000', elevation: 4,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 6, paddingVertical: 10,
    borderWidth: 2,
  },
  actionIcon: { fontSize: 16 },
  actionLabel: { fontSize: 12, fontWeight: '900' },
  editActionsRow: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: 16, gap: 10,
  },
  saveBtn: {
    flex: 1, borderRadius: 8, paddingVertical: 14,
    alignItems: 'center', borderWidth: 2,
    boxShadow: '2px 2px 0px #000', elevation: 2,
  },
  saveBtnText: { fontSize: 14, fontWeight: '900' },
  cancelEditBtn: {
    flex: 1, borderRadius: 8, paddingVertical: 14,
    alignItems: 'center', borderWidth: 2,
    boxShadow: '2px 2px 0px #000', elevation: 2,
  },
  cancelEditBtnText: { fontSize: 14, fontWeight: '900' },
  deleteBtn: {
    marginHorizontal: 16, marginTop: 20,
    borderWidth: 2, borderRadius: 8, paddingVertical: 14, alignItems: 'center',
  },
  deleteBtnText: { fontSize: 14, fontWeight: '900' },
})
