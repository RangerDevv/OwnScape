import { useRouter } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { supabase } from '@/lib/supabase'
import { validateEmail, validateHandle, validatePassword } from '@/lib/validation'
import { useAppTheme } from '@/hooks/use-app-theme'

export default function SignUpScreen() {
  const router = useRouter()
  const { colors } = useAppTheme()
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
    const emailErr = validateEmail(email)
    const passErr = validatePassword(password)
    const handleErr = validateHandle(userHandle)
    if (emailErr || passErr || handleErr) { setError(emailErr || passErr || handleErr || ''); return }
    setSubmitting(true)

    const { count } = await supabase.from('Users').select('*', { count: 'exact', head: true }).eq('user_handle', userHandle.trim())
    if (count && count > 0) { setError('That handle is already taken'); setSubmitting(false); return }

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
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.logoBadge, { backgroundColor: colors.pink, borderColor: colors.border }]}>
          <Text style={[styles.logoBadgeText, { color: colors.text }]}>OS</Text>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>JOIN OWNSCAPE</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Own your data. Share freely.</Text>

        <TextInput placeholder="Display Name" placeholderTextColor={colors.textSecondary} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          value={userName} onChangeText={setUserName} />
        <TextInput placeholder="Username / Handle" placeholderTextColor={colors.textSecondary} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          autoCapitalize="none" value={userHandle} onChangeText={setUserHandle} />
        <TextInput placeholder="Email address" placeholderTextColor={colors.textSecondary} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <TextInput placeholder="Password" placeholderTextColor={colors.textSecondary} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          secureTextEntry value={password} onChangeText={setPassword} />

        {!!error && <Text style={[styles.errorText, { color: colors.red }]}>{error}</Text>}
        {!!success && <Text style={[styles.successText, { color: colors.green }]}>{success}</Text>}

        <Pressable style={[styles.primaryButton, { backgroundColor: colors.pink, borderColor: colors.border }]} onPress={handleSignUp} disabled={submitting}>
          <Text style={[styles.primaryButtonText, { color: colors.text }]}>{submitting ? 'CREATING...' : 'CREATE ACCOUNT'}</Text>
        </Pressable>

        <Pressable style={[styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push('/')}>
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>BACK TO LOGIN</Text>
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
  title: { fontSize: 28, fontWeight: '900', letterSpacing: 1 },
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
  successText: { fontWeight: '700', marginBottom: 8 },
})
