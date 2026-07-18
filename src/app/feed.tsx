import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const FEED_ITEMS = [
  {
    id: '1',
    author: 'maya.r',
    text: 'New sketch series dropping this weekend. Which cover do you like more?',
    likes: 18,
  },
  {
    id: '2',
    author: 'jay.dev',
    text: 'Building my first social app in Expo today. Router is actually smooth.',
    likes: 41,
  },
  {
    id: '3',
    author: 'noah.fit',
    text: 'Morning run done. 5k at sunrise and feeling unstoppable.',
    likes: 9,
  },
];

export default function FeedScreen() {
  const router = useRouter();

  return (
    <View style={styles.page}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Feed</Text>
      </View>

      <ScrollView contentContainerStyle={styles.feedList}>
        {FEED_ITEMS.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.author}>@{item.author}</Text>
            <Text style={styles.postText}>{item.text}</Text>
            <Text style={styles.likes}>{item.likes} likes</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomNav}>
        <Pressable
          style={StyleSheet.compose(styles.navButton, styles.navButtonActive)}
          onPress={() => router.push('/feed')}>
          <Text style={StyleSheet.compose(styles.navText, styles.navTextActive)}>Feed</Text>
        </Pressable>
        <Pressable style={styles.navButton} onPress={() => router.push('/profile')}>
          <Text style={styles.navText}>Profile</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingTop: 54,
  },
  headerRow: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  feedList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  author: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  postText: {
    color: '#111827',
    fontSize: 15,
    lineHeight: 22,
  },
  likes: {
    marginTop: 10,
    color: '#6b7280',
    fontSize: 13,
  },
  bottomNav: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    flexDirection: 'row',
    gap: 10,
  },
  navButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  navButtonActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  navText: {
    color: '#111827',
    fontWeight: '600',
  },
  navTextActive: {
    color: '#ffffff',
  },
});