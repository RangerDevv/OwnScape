import { supabase } from './supabase'
import { handleError } from './errors'
import type { DbHashtag, DbPost, DbPostHashtag } from './database.types'

export const HASHTAG_RE = /#(\w+)/g

export function parseHashtags(text: string): string[] {
  const matches = text.match(HASHTAG_RE)
  if (!matches) return []
  return [...new Set(matches.map(t => t.slice(1).toLowerCase()))]
}

export async function linkHashtags(postId: number, text: string): Promise<void> {
  const tags = parseHashtags(text)
  if (tags.length === 0) return

  const { data: existing, error: existingErr } = await supabase
    .from('Hashtags')
    .select('id, tag')
    .in('tag', tags)
  if (existingErr) throw new Error(`Hashtags select failed: ${existingErr.message}`)

  const existingMap = new Map<string, number>(
    (existing as DbHashtag[] | null)?.map(h => [h.tag, h.id]) ?? []
  )

  const toUpsert = tags.filter(t => !existingMap.has(t))
  if (toUpsert.length > 0) {
    const { data: inserted, error: insertErr } = await supabase
      .from('Hashtags')
      .insert(toUpsert.map(tag => ({ tag })))
      .select('id, tag')
    if (insertErr) throw new Error(`Hashtags insert failed: ${insertErr.message}`)
    if (inserted) {
      for (const h of inserted as DbHashtag[]) {
        existingMap.set(h.tag, h.id)
      }
    }
  }

  const hashtagIds = [...new Set(tags.map(t => existingMap.get(t)).filter(Boolean))] as number[]
  if (hashtagIds.length === 0) return

  const links: DbPostHashtag[] = hashtagIds.map(hashtag_id => ({ post_id: postId, hashtag_id }))

  const { error: linkErr } = await supabase.from('PostHashtags').insert(links)
  if (linkErr) throw new Error(`PostHashtags insert failed: ${linkErr.message}`)

  const { error: rpcErr } = await supabase.rpc('increment_hashtag_post_count', { tag_names: tags })
  if (rpcErr) throw new Error(`Increment count RPC failed: ${rpcErr.message}`)
}

export async function unlinkHashtags(postId: number): Promise<void> {
  try {
    const { data: links } = await supabase
      .from('PostHashtags')
      .select('hashtag_id')
      .eq('post_id', postId)
    if (links && links.length > 0) {
      const ids = links.map(l => l.hashtag_id)
      const { data: hashtags } = await supabase
        .from('Hashtags')
        .select('tag')
        .in('id', ids)
      await supabase.from('PostHashtags').delete().eq('post_id', postId)
      if (hashtags && hashtags.length > 0) {
        const tagNames = hashtags.map(h => h.tag)
        await supabase.rpc('decrement_hashtag_post_count', { tag_names: tagNames })
      }
    }
  } catch (e) {
    handleError(e, 'unlinkHashtags')
  }
}

export async function getTrendingHashtags(limit = 10): Promise<DbHashtag[]> {
  const { data, error } = await supabase
    .from('Hashtags')
    .select('*')
    .order('post_count', { ascending: false })
    .limit(limit)
  if (error) {
    handleError(error, 'getTrendingHashtags')
    return []
  }
  return (data as DbHashtag[]) ?? []
}

export async function getPostsByHashtag(tag: string): Promise<DbPost[]> {
  const clean = tag.startsWith('#') ? tag.slice(1).toLowerCase() : tag.toLowerCase()
  const { data: hashtag, error: tagErr } = await supabase
    .from('Hashtags')
    .select('id')
    .eq('tag', clean)
    .maybeSingle()
  if (tagErr) {
    handleError(tagErr, 'getPostsByHashtag')
    return []
  }
  if (!hashtag) return []

  const { data: links, error: linkErr } = await supabase
    .from('PostHashtags')
    .select('post_id')
    .eq('hashtag_id', hashtag.id)
  if (linkErr) {
    handleError(linkErr, 'getPostsByHashtag')
    return []
  }
  if (!links || links.length === 0) return []

  const ids = links.map(l => l.post_id)
  const { data: posts, error: postsErr } = await supabase
    .from('Posts')
    .select('*')
    .in('id', ids)
    .order('created_at', { ascending: false })
  if (postsErr) {
    handleError(postsErr, 'getPostsByHashtag')
    return []
  }
  return (posts as DbPost[]) ?? []
}
