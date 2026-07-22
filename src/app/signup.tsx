import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../../lib/supabase';

async function signUpNewUser(email: string, password: string, firstName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
      },
    },
  });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSignUp = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);
    const result = await signUpNewUser(email.trim(), password, firstName.trim());
    setIsSubmitting(false);

    if (result.error) {
      setErrorMessage(result.error);
      return;
    }

    const data = result.data;

    if (!data) {
      setErrorMessage('Could not create account. Please try again.');
      return;
    }

    if (data.session) {
      router.replace('/feed');
      return;
    }

    setSuccessMessage('Account created. Check your email to confirm your account before logging in.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>OS</Text>
        </View>
        <Text style={styles.title}>JOIN OWNSCAPE</Text>
        <Text style={styles.subtitle}>Own your data. Share freely.</Text>

        <TextInput
          placeholder="Your Name"
          placeholderTextColor="#6b7280"
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          placeholder="Email address"
          placeholderTextColor="#6b7280"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#6b7280"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        {!!successMessage && <Text style={styles.successText}>{successMessage}</Text>}

        <Pressable style={styles.primaryButton} onPress={handleSignUp} disabled={isSubmitting}>
          <Text style={styles.primaryButtonText}>{isSubmitting ? 'CREATING...' : 'CREATE ACCOUNT'}</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => router.push('/')}>
          <Text style={styles.secondaryButtonText}>BACK TO LOGIN</Text>
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
    backgroundColor: '#ff70a6',
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
    fontSize: 28,
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
    backgroundColor: '#ff70a6',
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
  errorText: {
    color: '#dc2626',
    fontWeight: '700',
    marginBottom: 8,
  },
  successText: {
    color: '#166534',
    fontWeight: '700',
    marginBottom: 8,
  },
});
