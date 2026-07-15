# MVP Design Plan: Device-Native Photo Social App

**Core principle:** The server stores metadata and text permanently. It never stores full-resolution photo/video originals permanently — those live on the user's device and are cached temporarily (with a TTL) when served to others.

---

## 1. System Overview

Three components:

1. **Mobile app (iOS/Android)** — holds the user's photo library, runs a lightweight background sync client, serves as the "origin" for that user's media.
2. **Metadata server** — the social graph, post pointers, comments, likes, notifications. Small, relational, always-on.
3. **Cache/relay layer** — fetches image bytes from origin devices on-demand, holds them for a TTL, serves them to viewers, then purges.

```
[Phone 1] --upload/sync--> [Metadata Server] <--query-- [Phone 2]
       |                                                            |
       +-------------------- image bytes (cached, TTL) -------------+
                         via [Cache/Relay Layer]
```

---

## 2. What the Server Stores (Permanent)

| Table | Fields | Notes |
|---|---|---|
| `users` | id, username, public_key, created_at, device_tokens[] | One or more devices per user |
| `posts` | id, author_id, caption, content_hash, created_at, media_type, status (available/unreachable) | No image bytes — just a fingerprint |
| `follows` | follower_id, followee_id | Social graph |
| `likes` | id, post_id, user_id, created_at | Text-only, low privacy risk |
| `comments` | id, post_id, user_id, body, created_at | Text-only |
| `notifications` | id, user_id, type, payload, delivered_at | Queued until device reachable |

**Not stored:** full-res image/video files as permanent records.

---

## 3. What's Ephemeral (Cache Only)

| Data | TTL | Purpose |
|---|---|---|
| Full-res image/video bytes | 24–72 hrs after last fetch | Serve viewers without hammering origin device |
| Low-res thumbnail | 7–14 days | Fast feed scrolling |
| If origin unreachable and cache expired | — | Show "reconnecting..." placeholder, not broken image |

Thumbnails are a weaker but still real copy of their photo — this is an intentional tradeoff

---

## 4. Phone-Side Responsibilities

The mobile app needs to run a **lightweight background service** that:

- Registers with the metadata server on account creation (device token, public key)
- On new post: uploads a content hash + caption to metadata server, keeps the actual file local
- Listens for fetch requests (via push wake or WebRTC signaling) and streams bytes to the relay/cache layer when the photo is requested and not already cached
- On photo deletion: pushes a "revoke" signal to the metadata server, which purges the cache immediately and marks the post `unreachable`

**Reality check for MVP:** iOS and Android both aggressively limit background execution. You will not get instant wake-and-serve reliably. Plan around:
- Silent push notifications to wake the app briefly (Apple's `content-available` push, Android FCM data messages) — works most of the time, not guaranteed, rate-limited by the OS.
- Accept that "serve directly from phone" is a best-effort fast path; the TTL cache is your reliability fallback.

---

## 5. Fetch Flow (Read Path)

1. Bob opens the app, requests Alice's post.
2. Metadata server returns the post pointer + content hash.
3. Cache layer checks: do I have this cached and fresh? 
   - **Yes** → serve immediately.
   - **No** → send wake signal to Alice's phone, wait briefly (e.g. 5–10s timeout) for her phone to stream the bytes, cache them, serve to Bob.
   - **Timeout / unreachable** → serve thumbnail if cached, or a placeholder state.

---

## 6. Delete Flow

1. Alice deletes the photo on her device.
2. App sends a signed "revoke" message to the metadata server.
3. Server immediately purges any cached copy, marks the post `unreachable`, and stops serving it.
4. Post metadata (caption, likes, comments) can either be deleted too, or kept as a "tombstone" (post existed, now removed) depending on your product decision.

---

## 7. MVP Build Order

**Phase 1 — Core loop, no fanciness**
- User accounts, device registration
- Upload flow: phone hashes + registers post, uploads bytes to cache layer directly (skip live P2P fetch for MVP — just do server-side caching with a delete-triggered purge)
- Feed showing cached images
- Delete → purge cache

This alone proves the core privacy claim ("we don't keep your originals after you delete") without you having to solve the hard P2P wake-and-serve problem yet.

**Phase 2 — Social graph**
- Follow/unfollow, likes, comments, notifications

**Phase 3 — True origin-fetch**
- Replace "cache layer holds everything indefinitely until delete" with real TTL expiry + on-demand re-fetch from device
- Push-wake sync client
- Fallback placeholder states for unreachable media

**Phase 4 — Hardening**
- WebRTC direct peer path for when both users are online (reduces server bandwidth/cost)
- Multi-device support per user
- Abuse/moderation tooling (this gets harder without a permanent central archive)

---

## 8. Open Product Decisions to Make Before Building

- **Comments/likes**: server-permanent (recommended) or also device-synced (much harder, probably not MVP)?
- **Tombstones**: when a post is deleted, do comments/likes vanish too, or remain as an orphaned record?
- **Moderation**: how do you review reported content if you don't keep permanent copies? (Likely need a short mandatory retention window for reported content specifically — a real legal/trust & safety necessity, worth deciding upfront.)
- **Multi-device**: what happens when Alice's photo lives on her old phone and she gets a new one — migration/backup story?

---

## 9. Prior Art Worth Studying Before You Build

- **Secure Scuttlebutt** — closest existing analog to pure peer-hosted; instructive on where it got stuck (offline reachability, sync conflicts).
- **AT Protocol (Bluesky)** — Personal Data Server model, closest to "user owns a data repo, apps just read/write to it."
- **Nostr** — dumb, swappable relays; good model for cache layer.
- **IPFS** — content-addressing and "unpin = disappears" pattern, relevant to your delete semantics.

---

## 10. Technologies to Use

**TBD**