export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const HANDLE_RE = /^[a-zA-Z0-9_]{3,20}$/

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required'
  if (!EMAIL_RE.test(email.trim())) return 'Enter a valid email address'
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required'
  if (password.length < 6) return 'Password must be at least 6 characters'
  return null
}

export function validateHandle(handle: string): string | null {
  if (!handle.trim()) return 'Choose a handle'
  if (!HANDLE_RE.test(handle.trim())) return 'Handle: 3-20 letters, numbers, underscores'
  return null
}
