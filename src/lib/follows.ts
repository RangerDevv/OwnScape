import { supabase } from './supabase'
import type { DbUser } from './database.types'
import { handleError } from './errors'
import { createNotification } from './notifications'

export async function isFollowing(followerId: string, followeeId: string): Promise<boolean> {
  try {
    const { count } = await supabase
      .from('Follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', followerId)
      .eq('followee_id', followeeId)
    return (count ?? 0) > 0
  } catch (e) {
    handleError(e, 'isFollowing')
    return false
  }
}

export async function getFollowCounts(userId: string): Promise<{ followers: number; following: number }> {
  try {
    const [followerResult, followingResult] = await Promise.all([
      supabase.from('Follows').select('*', { count: 'exact', head: true }).eq('followee_id', userId),
      supabase.from('Follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
    ])
    return {
      followers: followerResult.count ?? 0,
      following: followingResult.count ?? 0,
    }
  } catch (e) {
    handleError(e, 'getFollowCounts')
    return { followers: 0, following: 0 }
  }
}

export async function getFollowers(userId: string): Promise<DbUser[]> {
  try {
    const { data: follows } = await supabase
      .from('Follows')
      .select('follower_id')
      .eq('followee_id', userId)
    if (!follows || follows.length === 0) return []
    const ids = follows.map(f => f.follower_id)
    const { data: users } = await supabase
      .from('Users')
      .select('id, user_name, user_handle, user_bio')
      .in('id', ids)
    return (users as DbUser[]) || []
  } catch (e) {
    handleError(e, 'getFollowers')
    return []
  }
}

export async function getFollowing(userId: string): Promise<DbUser[]> {
  try {
    const { data: follows } = await supabase
      .from('Follows')
      .select('followee_id')
      .eq('follower_id', userId)
    if (!follows || follows.length === 0) return []
    const ids = follows.map(f => f.followee_id)
    const { data: users } = await supabase
      .from('Users')
      .select('id, user_name, user_handle, user_bio')
      .in('id', ids)
    return (users as DbUser[]) || []
  } catch (e) {
    handleError(e, 'getFollowing')
    return []
  }
}

export async function followUser(followerId: string, followeeId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('Follows').insert({
      follower_id: followerId,
      followee_id: followeeId,
    })
    if (!error) {
      await createNotification({
        recipientId: followeeId,
        actorId: followerId,
        type: 'follow',
      })
    }
    return !error
  } catch (e) {
    handleError(e, 'followUser')
    return false
  }
}

export async function unfollowUser(followerId: string, followeeId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('Follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('followee_id', followeeId)
    return !error
  } catch (e) {
    handleError(e, 'unfollowUser')
    return false
  }
}
