import { supabase } from './supabase'
import type { DbUser } from './database.types'

export async function isFollowing(followerId: string, followeeId: string): Promise<boolean> {
  const { count } = await supabase
    .from('Follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', followerId)
    .eq('followee_id', followeeId)
  return (count ?? 0) > 0
}

export async function getFollowCounts(userId: string): Promise<{ followers: number; following: number }> {
  const [followerResult, followingResult] = await Promise.all([
    supabase.from('Follows').select('*', { count: 'exact', head: true }).eq('followee_id', userId),
    supabase.from('Follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
  ])
  return {
    followers: followerResult.count ?? 0,
    following: followingResult.count ?? 0,
  }
}

export async function getFollowers(userId: string): Promise<DbUser[]> {
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
}

export async function getFollowing(userId: string): Promise<DbUser[]> {
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
}

export async function followUser(followerId: string, followeeId: string): Promise<boolean> {
  const { error } = await supabase.from('Follows').insert({
    follower_id: followerId,
    followee_id: followeeId,
  })
  return !error
}

export async function unfollowUser(followerId: string, followeeId: string): Promise<boolean> {
  const { error } = await supabase
    .from('Follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('followee_id', followeeId)
  return !error
}
