import { useRouter } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { supabase } from '@/lib/supabase'
import { validateEmail, validatePassword } from '@/lib/validation'
import { useAppTheme } from '@/hooks/use-app-theme'

export default function LoginScreen() {
  const router = useRouter()
  const { colors } = useAppTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setError('')
    const emailErr = validateEmail(email)
    const passErr = validatePassword(password)
    if (emailErr || passErr) { setError(emailErr || passErr || ''); return }
    setSubmitting(true)
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setSubmitting(false)
    if (err) { setError(err.message); return }
    router.replace('/feed')
  }

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.logoBadge, { backgroundColor: colors.yellow, borderColor: colors.border }]}>
          <Text style={[styles.logoBadgeText, { color: colors.text }]}>OS</Text>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>OWNSCAPE</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Log in to your decentralized feed</Text>

        <TextInput placeholder="Email address" placeholderTextColor={colors.textSecondary} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput placeholder="Password" placeholderTextColor={colors.textSecondary} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          secureTextEntry value={password} onChangeText={setPassword} />

        {!!error && <Text style={[styles.errorText, { color: colors.red }]}>{error}</Text>}

        <Pressable style={[styles.primaryButton, { backgroundColor: colors.yellow, borderColor: colors.border }]} onPress={handleLogin} disabled={submitting}>
          <Text style={[styles.primaryButtonText, { color: colors.text }]}>{submitting ? 'LOGGING IN...' : 'LOG IN'}</Text>
        </Pressable>

        <Pressable style={[styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push('/signup')}>
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>CREATE ACCOUNT</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  card: {
    borderRadius: 16, padding: 24, borderWidth: 3,
    boxShadow: '6px 6px 0px #000', elevation: 6,
  },
  logoBadge: {
    width: 52, height: 52, borderRadius: 8, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    boxShadow: '3px 3px 0px #000',
  },
  logoBadgeText: { fontSize: 20, fontWeight: '900' },
  title: { fontSize: 32, fontWeight: '900', letterSpacing: 1 },
  subtitle: { fontSize: 14, fontWeight: '700', marginTop: 4, marginBottom: 24 },
  input: {
    borderWidth: 2, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 14, marginBottom: 14, fontSize: 15, fontWeight: '600',
  },
  primaryButton: {
    borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 4,
    borderWidth: 3,
    boxShadow: '4px 4px 0px #000', elevation: 4,
  },
  primaryButtonText: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  secondaryButton: {
    borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 12,
    borderWidth: 2,
    boxShadow: '3px 3px 0px #000', elevation: 3,
  },
  secondaryButtonText: { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  errorText: { fontWeight: '700', marginBottom: 8 },
})
