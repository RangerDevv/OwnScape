import { useRouter } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { supabase } from '@/lib/supabase'

export default function SignUpScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userName, setUserName] = useState('')
  const [userHandle, setUserHandle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSignUp = async () => {
    setError('')
    setSuccess('')
    if (!userHandle.trim()) { setError('Choose a handle'); return }
    setSubmitting(true)

    const { data, error: authErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { user_name: userName.trim(), user_handle: userHandle.trim() } },
    })
    if (authErr || !data.user) {
      setSubmitting(false)
      setError(authErr?.message || 'Sign up failed')
      return
    }

    const newUser = {
      id: data.user.id,
      email: email.trim(),
      user_handle: userHandle.trim(),
      user_name: userName.trim() || null,
      user_bio: null,
      follower_count: 0,
      following_count: 0,
      isPublic: true,
    }

    const { error: insertErr } = await supabase.from('Users').insert(newUser)

    setSubmitting(false)

    if (insertErr) {
      console.warn('Users insert failed (will retry on profile load):', insertErr.message)
    }

    if (data.session) {
      router.replace('/feed')
      return
    }

    setSuccess('Account created. Check your email to confirm before logging in.')
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.card}>
        <View style={styles.logoBadge}><Text style={styles.logoBadgeText}>OS</Text></View>
        <Text style={styles.title}>JOIN OWNSCAPE</Text>
        <Text style={styles.subtitle}>Own your data. Share freely.</Text>

        <TextInput placeholder="Display Name" placeholderTextColor="#6b7280" style={styles.input}
          value={userName} onChangeText={setUserName} />
        <TextInput placeholder="Username / Handle" placeholderTextColor="#6b7280" style={styles.input}
          autoCapitalize="none" value={userHandle} onChangeText={setUserHandle} />
        <TextInput placeholder="Email address" placeholderTextColor="#6b7280" style={styles.input}
          autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput placeholder="Password" placeholderTextColor="#6b7280" style={styles.input}
          secureTextEntry value={password} onChangeText={setPassword} />

        {!!error && <Text style={styles.errorText}>{error}</Text>}
        {!!success && <Text style={styles.successText}>{success}</Text>}

        <Pressable style={styles.primaryButton} onPress={handleSignUp} disabled={submitting}>
          <Text style={styles.primaryButtonText}>{submitting ? 'CREATING...' : 'CREATE ACCOUNT'}</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => router.push('/')}>
          <Text style={styles.secondaryButtonText}>BACK TO LOGIN</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fffdf0' },
  card: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 24, borderWidth: 3, borderColor: '#000000',
    shadowColor: '#000000', shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6,
  },
  logoBadge: {
    width: 52, height: 52, backgroundColor: '#ff70a6', borderRadius: 8, borderWidth: 3, borderColor: '#000000',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: '#000000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0,
  },
  logoBadgeText: { fontSize: 20, fontWeight: '900', color: '#000000' },
  title: { fontSize: 28, fontWeight: '900', color: '#000000', letterSpacing: 1 },
  subtitle: { fontSize: 14, fontWeight: '700', marginTop: 4, marginBottom: 24, color: '#4b5563' },
  input: {
    backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#000000', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 14, marginBottom: 14, fontSize: 15, fontWeight: '600', color: '#000000',
  },
  primaryButton: {
    backgroundColor: '#ff70a6', borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 4,
    borderWidth: 3, borderColor: '#000000',
    shadowColor: '#000000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4,
  },
  primaryButtonText: { color: '#000000', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  secondaryButton: {
    borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 12,
    borderWidth: 2, borderColor: '#000000', backgroundColor: '#ffffff',
    shadowColor: '#000000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  secondaryButtonText: { color: '#000000', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  errorText: { color: '#dc2626', fontWeight: '700', marginBottom: 8 },
  successText: { color: '#166534', fontWeight: '700', marginBottom: 8 },
})
