import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>OS</Text>
        </View>
        <Text style={styles.title}>OWNSCAPE</Text>
        <Text style={styles.subtitle}>Log in to your decentralized feed</Text>

        <TextInput
          placeholder="Email address"
          placeholderTextColor="#6b7280"
          style={styles.input}
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#6b7280"
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable style={styles.primaryButton} onPress={() => router.push('/feed')}>
          <Text style={styles.primaryButtonText}>LOG IN</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => router.push('/signup')}>
          <Text style={styles.secondaryButtonText}>CREATE ACCOUNT</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fffdf0',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 3,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  logoBadge: {
    width: 52,
    height: 52,
    backgroundColor: '#ffe600',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  logoBadgeText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 24,
    color: '#4b5563',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  primaryButton: {
    backgroundColor: '#ffe600',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
    borderWidth: 3,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  secondaryButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
