import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function ProfileScreen() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    setIsSigningOut(false);
    router.replace('/');
  };

  return (
    <View style={styles.page}>
      <Text style={styles.headerTitle}>PROFILE</Text>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>JS</Text>
        </View>
        <Text style={styles.name}>JORDAN STONE</Text>
        <Text style={styles.handle}>@jordanstone</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>128</Text>
            <Text style={styles.statLabel}>POSTS</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>5.3k</Text>
            <Text style={styles.statLabel}>FOLLOWERS</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>402</Text>
            <Text style={styles.statLabel}>FOLLOWING</Text>
          </View>
        </View>

        <Pressable style={styles.signOutButton} onPress={handleSignOut} disabled={isSigningOut}>
          <Text style={styles.signOutButtonText}>{isSigningOut ? 'SIGNING OUT...' : 'SIGN OUT'}</Text>
        </Pressable>
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <Pressable style={styles.navItem} onPress={() => router.push('/feed')}>
          <Text style={styles.navIconSymbol}>⭐</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.push('/explore')}>
          <Text style={styles.navIconSymbol}>🔍</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.push('/feed')}>
          <Text style={styles.navIconSymbol}>🏠</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => {}}>
          <Text style={styles.navIconSymbol}>➕</Text>
        </Pressable>
        <Pressable style={styles.navItemActive} onPress={() => router.push('/profile')}>
          <Text style={styles.navIconActiveSymbol}>👤</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#fffdf0',
    paddingTop: 54,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 16,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    borderWidth: 3,
    borderColor: '#000000',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#ffe600',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  avatarText: {
    color: '#000000',
    fontSize: 28,
    fontWeight: '900',
  },
  name: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
  },
  handle: {
    marginTop: 2,
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: '#000000',
  },
  statsRow: {
    marginTop: 24,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 8,
    paddingVertical: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
  },
  statLabel: {
    marginTop: 2,
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
  },
  signOutButton: {
    marginTop: 20,
    width: '100%',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
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
