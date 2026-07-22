import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const STORIES = [
  { id: 'add', type: 'add', color: '#38bdf8' },
  { id: '1', name: 'Cat', image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&auto=format&fit=crop&q=80', color: '#ff70a6' },
  { id: '2', name: 'Marcus', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80', color: '#ffd166' },
  { id: '3', name: 'Duck', image: 'https://images.unsplash.com/photo-1555169062-01347abf4bac?w=200&auto=format&fit=crop&q=80', color: '#70c1b3' },
  { id: '4', name: 'Goldie', image: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=200&auto=format&fit=crop&q=80', color: '#ff9f1c' },
];

const FEED_POSTS = [
  {
    id: '1',
    author: 'JOHN DOE',
    handle: '@johndoe',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    time: '20 MINS AGO',
    image: 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=800&auto=format&fit=crop&q=80',
    text: 'Social media should not be something where you have to worry about big corporations stealing your data and using it for their goals that you may or may not agree and you loose access to YOUR content. Share freely own everything',
    likes: 34,
    comments: 8,
    starred: true,
  },
  {
    id: '2',
    author: 'MAYA RIVERA',
    handle: '@mayar',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    time: '2 HOURS AGO',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    text: 'Sunsets on the decentralized network hit different. No algorithms hiding your creations, just pure connection.',
    likes: 52,
    comments: 14,
    starred: false,
  },
];

export default function FeedScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState(FEED_POSTS);
  const [commentText, setCommentText] = useState('');

  const toggleStar = (id: string) => {
    setPosts(posts.map(p => p.id === id ? { ...p, starred: !p.starred, likes: p.starred ? p.likes - 1 : p.likes + 1 } : p));
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Stories Section */}
        <View style={styles.storiesSection}>
          <Text style={styles.storiesTitle}>STORIES</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesList}>
            {STORIES.map((story) => (
              story.type === 'add' ? (
                <Pressable key={story.id} style={styles.addStoryItem}>
                  <View style={[styles.addStoryCircle, { backgroundColor: story.color }]}>
                    <Text style={styles.plusSymbol}>+</Text>
                  </View>
                </Pressable>
              ) : (
                <Pressable key={story.id} style={styles.storyItem}>
                  <View style={[styles.storyRing, { backgroundColor: story.color }]}>
                    <Image source={{ uri: story.image }} style={styles.storyAvatar} />
                  </View>
                </Pressable>
              )
            ))}
          </ScrollView>
        </View>

        {/* Feed Posts */}
        {posts.map((post) => (
          <View key={post.id} style={styles.postCard}>
            {/* Author Row */}
            <View style={styles.authorRow}>
              <View style={styles.authorInfo}>
                <Image source={{ uri: post.avatar }} style={styles.authorAvatar} />
                <Text style={styles.authorName}>{post.author}</Text>
              </View>
              <Text style={styles.postTime}>{post.time}</Text>
            </View>

            {/* Post Image */}
            <View style={styles.imageContainer}>
              <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
            </View>

            {/* Post Caption */}
            <Text style={styles.postCaption}>{post.text}</Text>

            {/* Action Bar & Comment Input */}
            <View style={styles.actionFooter}>
              <View style={styles.actionButtons}>
                <Pressable onPress={() => toggleStar(post.id)} style={styles.actionBtn}>
                  <Text style={styles.actionIcon}>{post.starred ? '⭐' : '☆'}</Text>
                </Pressable>
                <Pressable style={styles.actionBtn}>
                  <Text style={styles.actionIcon}>💬</Text>
                </Pressable>
                <Pressable style={styles.actionBtn}>
                  <Text style={styles.actionIcon}>✈️</Text>
                </Pressable>
              </View>

              <View style={styles.commentInputContainer}>
                <TextInput
                  placeholder="Leave a comment..."
                  placeholderTextColor="#6b7280"
                  style={styles.commentInput}
                  value={commentText}
                  onChangeText={setCommentText}
                />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <Pressable style={styles.navItem} onPress={() => router.push('/feed')}>
          <Text style={styles.navIconSymbol}>⭐</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.push('/explore')}>
          <Text style={styles.navIconSymbol}>🔍</Text>
        </Pressable>
        <Pressable style={styles.navItemActive} onPress={() => router.push('/feed')}>
          <Text style={styles.navIconActiveSymbol}>🏠</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => {}}>
          <Text style={styles.navIconSymbol}>➕</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.push('/profile')}>
          <Text style={styles.navIconSymbol}>👤</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#fffdf0',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 3,
    borderBottomColor: '#000000',
  },
  iconButton: {
    width: 44,
    height: 44,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  iconSymbol: {
    fontSize: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoDot: {
    width: 14,
    height: 14,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#000000',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  storiesSection: {
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 3,
    borderBottomColor: '#000000',
  },
  storiesTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
    paddingHorizontal: 16,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  storiesList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  addStoryItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStoryCircle: {
    width: 68,
    height: 68,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  plusSymbol: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000000',
  },
  storyItem: {
    alignItems: 'center',
  },
  storyRing: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#000000',
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  storyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#000000',
  },
  postCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 12,
    padding: 16,
    borderWidth: 3,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#000000',
  },
  authorName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
  },
  postTime: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  imageContainer: {
    width: '100%',
    height: 320,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#000000',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postCaption: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    lineHeight: 22,
    marginBottom: 16,
  },
  actionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ff70a6',
    borderRadius: 8,
    padding: 10,
    borderWidth: 3,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  actionIcon: {
    fontSize: 16,
  },
  commentInputContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 40,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  commentInput: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1f2937',
    padding: 0,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 70,
    backgroundColor: '#ffe600',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#000000',
  },
  navItem: {
    width: 44,
    height: 44,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  navItemActive: {
    width: 48,
    height: 48,
    backgroundColor: '#000000',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  navIconSymbol: {
    fontSize: 20,
  },
  navIconActiveSymbol: {
    fontSize: 20,
    color: '#ffffff',
  },
});
