import { useEffect, useRef, useState } from 'react'
import {
  FlatList, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps,
} from 'react-native'
import { searchUsers } from '@/lib/mentions'
import { useAppTheme } from '@/hooks/use-app-theme'
import UserAvatar from '@/components/user-avatar'
import type { DbUser } from '@/lib/database.types'

type Props = TextInputProps & {
  inputRef?: React.RefObject<TextInput>
}

export function MentionInput({ inputRef, ...props }: Props) {
  const { colors } = useAppTheme()
  const [mentionQuery, setMentionQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Pick<DbUser, 'id' | 'user_name' | 'user_handle' | 'avatar_url'>[]>([])
  const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 })
  const [showSuggestions, setShowSuggestions] = useState(false)
  const valueRef = useRef('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const detectMention = (text: string, sel: { start: number; end: number }) => {
    const before = text.slice(0, sel.start)
    const atIdx = before.lastIndexOf('@')
    if (atIdx === -1 || (atIdx > 0 && before[atIdx - 1] !== ' ' && before[atIdx - 1] !== '\n')) {
      setShowSuggestions(false)
      return
    }
    const query = before.slice(atIdx + 1)
    if (!query || query.includes(' ') || query.includes('@')) {
      setShowSuggestions(false)
      return
    }
    setMentionQuery(query)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const results = await searchUsers(query)
      setSuggestions(results)
      setShowSuggestions(results.length > 0)
    }, 200)
  }

  const handleChangeText = (text: string) => {
    valueRef.current = text
    props.onChangeText?.(text)
    detectMention(text, selection)
  }

  const handleSelectionChange = (e: { nativeEvent: { selection: { start: number; end: number } } }) => {
    const sel = e.nativeEvent.selection
    setSelection(sel)
    detectMention(valueRef.current, sel)
  }

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  const selectMention = (user: Pick<DbUser, 'id' | 'user_name' | 'user_handle' | 'avatar_url'>) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const text = valueRef.current
    const before = text.slice(0, selection.start)
    const atIdx = before.lastIndexOf('@')
    if (atIdx === -1) return

    const afterAt = text.slice(atIdx)
    const spaceIdx = afterAt.search(/\s/)
    const partialEnd = atIdx + (spaceIdx === -1 ? afterAt.length : spaceIdx)

    const newText = text.slice(0, atIdx) + `@${user.user_handle} ` + text.slice(partialEnd)
    valueRef.current = newText
    props.onChangeText?.(newText)
    setShowSuggestions(false)
    setMentionQuery('')
  }

  return (
    <View style={styles.wrapper}>
      <TextInput
        ref={inputRef}
        {...props}
        onChangeText={handleChangeText}
        onSelectionChange={handleSelectionChange}
      />
      {showSuggestions && mentionQuery && (
        <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                style={[styles.suggestionRow, { borderBottomColor: colors.gray }]}
                onPress={() => selectMention(item)}
              >
                <UserAvatar
                  avatarUrl={item.avatar_url}
                  name={item.user_name}
                  handle={item.user_handle}
                  size={28}
                  borderColor={colors.border}
                />
                <View style={styles.suggestionInfo}>
                  <Text style={[styles.suggestionName, { color: colors.text }]} numberOfLines={1}>
                    {item.user_name || item.user_handle}
                  </Text>
                  <Text style={[styles.suggestionHandle, { color: colors.textSecondary }]}>
                    @{item.user_handle}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative', zIndex: 100 },
  dropdown: {
    position: 'absolute', left: 0, right: 0, top: '100%',
    maxHeight: 200, borderRadius: 8, borderWidth: 2, zIndex: 200,
    boxShadow: '3px 3px 0px rgba(0,0,0,0.3)', elevation: 5,
  },
  suggestionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1,
  },
  suggestionInfo: { flex: 1 },
  suggestionName: { fontSize: 13, fontWeight: '800' },
  suggestionHandle: { fontSize: 11, fontWeight: '600' },
})
