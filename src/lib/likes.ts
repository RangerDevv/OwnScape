import { supabase } from './supabase'

export async function getLikedPostIds(userId: string): Promise<Set<number>> {
  const { data } = await supabase
    .from('Likes')
    .select('post_id')
    .eq('user_id', userId)
  return new Set((data || []).map(r => r.post_id))
}

export async function addLike(userId: string, postId: number): Promise<boolean> {
  const { error } = await supabase
    .from('Likes')
    .insert({ post_id: postId, user_id: userId })
  if (error) return false

  const { data: post } = await supabase
    .from('Posts')
    .select('like_count')
    .eq('id', postId)
    .single()
  if (post) {
    await supabase
      .from('Posts')
      .update({ like_count: (post.like_count || 0) + 1 })
      .eq('id', postId)
  }
  return true
}

export async function removeLike(userId: string, postId: number): Promise<boolean> {
  const { error } = await supabase
    .from('Likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId)
  if (error) return false

  const { data: post } = await supabase
    .from('Posts')
    .select('like_count')
    .eq('id', postId)
    .single()
  if (post) {
    await supabase
      .from('Posts')
      .update({ like_count: Math.max(0, (post.like_count || 0) - 1) })
      .eq('id', postId)
  }
  return true
}
