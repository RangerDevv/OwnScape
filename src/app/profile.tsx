import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <View style={styles.page}>
      <Text style={styles.headerTitle}>Profile</Text>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>JS</Text>
        </View>
        <Text style={styles.name}>Jordan Stone</Text>
        <Text style={styles.handle}>@jordanstone</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>128</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>5.3k</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>402</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomNav}>
        <Pressable style={styles.navButton} onPress={() => router.push('/feed')}>
          <Text style={styles.navText}>Feed</Text>
        </Pressable>
        <Pressable
          style={StyleSheet.compose(styles.navButton, styles.navButtonActive)}
          onPress={() => router.push('/profile')}>
          <Text style={StyleSheet.compose(styles.navText, styles.navTextActive)}>Profile</Text>
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
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
  },
  name: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  handle: {
    marginTop: 2,
    color: '#6b7280',
    fontSize: 14,
  },
  statsRow: {
    marginTop: 18,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    marginTop: 2,
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