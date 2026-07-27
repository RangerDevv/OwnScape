export interface DbUser {
  id: string
  created_at: string
  email: string
  user_handle: string
  user_bio: string | null
  avatar_url: string | null
  follower_count: number | null
  following_count: number
  isPublic: boolean
  user_name: string | null
}

export interface DbNotification {
  id: number
  created_at: string
  recipient_id: string
  actor_id: string
  type: 'like' | 'comment' | 'follow'
  post_id: number | null
  read: boolean
}

export interface DbPost {
  id: number
  created_at: string
  handle: string
  storage_key: string | null
  cached_until: number | null
  author_id: string
  like_count: number
  share_count: number
  description: string
}

export interface DbComment {
  id: number
  created_at: string
  comment_body: string
  post_id: number
  author_id: string
}

export interface DbFollow {
  follower_id: string
  followee_id: string
  created_at: string
}

export interface DbLike {
  post_id: number
  user_id: string
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      Users: { Row: DbUser; Insert: Omit<DbUser, 'created_at'>; Update: Partial<DbUser> }
      Posts: { Row: DbPost; Insert: Omit<DbPost, 'id' | 'created_at'>; Update: Partial<DbPost> }
      Comments: { Row: DbComment; Insert: Omit<DbComment, 'id' | 'created_at'>; Update: Partial<DbComment> }
      Follows: { Row: DbFollow; Insert: Omit<DbFollow, 'created_at'>; Update: Partial<DbFollow> }
      Likes: { Row: DbLike; Insert: Omit<DbLike, 'created_at'>; Update: Partial<DbLike> }
      Notifications: { Row: DbNotification; Insert: Omit<DbNotification, 'id' | 'created_at'>; Update: Partial<DbNotification> }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
