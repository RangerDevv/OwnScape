import { supabase } from './supabase'
import { handleError } from './errors'
import type { DbNotification } from './database.types'

export async function createNotification(params: {
  recipientId: string
  actorId: string
  type: 'like' | 'comment' | 'follow' | 'mention'
  postId?: number | null
}): Promise<void> {
  try {
    const { recipientId, actorId, type, postId } = params
    if (recipientId === actorId) return
    await supabase.from('Notifications').insert({
      recipient_id: recipientId,
      actor_id: actorId,
      type,
      post_id: postId ?? null,
    })
  } catch (e) {
    handleError(e, 'createNotification')
  }
}

export async function fetchNotifications(userId: string): Promise<DbNotification[]> {
  try {
    const { data } = await supabase
      .from('Notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    return (data as DbNotification[]) || []
  } catch (e) {
    handleError(e, 'fetchNotifications')
    return []
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const { count } = await supabase
      .from('Notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('read', false)
    return count ?? 0
  } catch (e) {
    handleError(e, 'getUnreadCount')
    return 0
  }
}

export async function markAsRead(notificationIds: number[]): Promise<void> {
  if (notificationIds.length === 0) return
  try {
    await supabase
      .from('Notifications')
      .update({ read: true })
      .in('id', notificationIds)
  } catch (e) {
    handleError(e, 'markAsRead')
  }
}

export async function markAllAsRead(userId: string): Promise<void> {
  try {
    await supabase
      .from('Notifications')
      .update({ read: true })
      .eq('recipient_id', userId)
      .eq('read', false)
  } catch (e) {
    handleError(e, 'markAllAsRead')
  }
}

let subId = 0
export function subscribeToNotifications(
  userId: string,
  onNew: (notification: DbNotification) => void,
) {
  const channel = supabase
    .channel(`notifications-${userId}-${subId++}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'Notifications',
        filter: `recipient_id=eq.${userId}`,
      },
      (payload) => {
        onNew(payload.new as DbNotification)
      },
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
