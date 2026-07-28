import { supabase } from './supabase'
import { createNotification } from './notifications'
import type { DbUser } from './database.types'

const MENTION_RE = /@(\w+)/g

export function parseMentions(text: string): string[] {
  const matches = text.match(MENTION_RE)
  if (!matches) return []
  return [...new Set(matches.map(t => t.slice(1).toLowerCase()))]
}

export async function searchUsers(query: string, limit = 8): Promise<Pick<DbUser, 'id' | 'user_name' | 'user_handle' | 'avatar_url'>[]> {
  if (!query || query.length < 1) return []
  const q = `%${query}%`
  const { data } = await supabase
    .from('Users')
    .select('id, user_name, user_handle, avatar_url')
    .or(`user_handle.ilike.${q},user_name.ilike.${q}`)
    .limit(limit)
  return (data ?? []) as Pick<DbUser, 'id' | 'user_name' | 'user_handle' | 'avatar_url'>[]
}

export async function findUserIdsByHandle(handles: string[]): Promise<Map<string, string>> {
  if (handles.length === 0) return new Map()
  const cleaned = handles.map(h => h.startsWith('@') ? h.slice(1).toLowerCase() : h.toLowerCase())
  const { data } = await supabase
    .from('Users')
    .select('id, user_handle')
    .in('user_handle', cleaned)
  const map = new Map<string, string>()
  if (data) {
    for (const u of data) {
      map.set(u.user_handle.toLowerCase(), u.id)
    }
  }
  return map
}

export async function processMentions(
  text: string,
  actorId: string,
  postId?: number,
  commentId?: number,
): Promise<void> {
  const handles = parseMentions(text)
  if (handles.length === 0) return

  const userIdMap = await findUserIdsByHandle(handles)
  if (userIdMap.size === 0) return

  for (const [, userId] of userIdMap) {
    const { error } = await supabase.from('Mentions').insert({
      mentioned_user_id: userId,
      actor_id: actorId,
      post_id: postId ?? null,
      comment_id: commentId ?? null,
    })
    if (!error) {
      await createNotification({
        recipientId: userId,
        actorId,
        type: 'mention',
        postId,
      })
    }
  }
}

export async function removeMentions(postId?: number, commentId?: number): Promise<void> {
  if (!postId && !commentId) return
  const query = supabase.from('Mentions').delete()
  if (postId) query.eq('post_id', postId)
  if (commentId) query.eq('comment_id', commentId)
  await query
}
