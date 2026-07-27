export interface DbUser {
  id: string
  created_at: string
  email: string
  user_handle: string
  user_bio: string | null
  follower_count: number | null
  following_count: number
  isPublic: boolean
  user_name: string | null
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

export interface Database {
  public: {
    Tables: {
      Users: { Row: DbUser; Insert: Omit<DbUser, 'created_at'>; Update: Partial<DbUser> }
      Posts: { Row: DbPost; Insert: Omit<DbPost, 'id' | 'created_at'>; Update: Partial<DbPost> }
      Comments: { Row: DbComment; Insert: Omit<DbComment, 'id' | 'created_at'>; Update: Partial<DbComment> }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
