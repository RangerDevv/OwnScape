import { supabase } from './supabase'
import { handleError } from './errors'
import { createNotification } from './notifications'

export async function getLikedPostIds(userId: string): Promise<Set<number>> {
  try {
    const { data } = await supabase
      .from('Likes')
      .select('post_id')
      .eq('user_id', userId)
    return new Set((data || []).map(r => r.post_id))
  } catch (e) {
    handleError(e, 'getLikedPostIds')
    return new Set()
  }
}

export async function addLike(userId: string, postId: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('Likes')
      .insert({ post_id: postId, user_id: userId })
    if (error) return false

    const { data: post } = await supabase
      .from('Posts')
      .select('author_id')
      .eq('id', postId)
      .single()
    if (post) {
      const { error: rpcErr } = await supabase.rpc('increment_like_count', { post_id: postId })
      if (rpcErr) return false

      await createNotification({
        recipientId: post.author_id,
        actorId: userId,
        type: 'like',
        postId,
      })
    }
    return true
  } catch (e) {
    handleError(e, 'addLike')
    return false
  }
}

export async function removeLike(userId: string, postId: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('Likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)
    if (error) return false

    const { error: rpcErr } = await supabase.rpc('decrement_like_count', { post_id: postId })
    if (rpcErr) return false
    return true
  } catch (e) {
    handleError(e, 'removeLike')
    return false
  }
}
