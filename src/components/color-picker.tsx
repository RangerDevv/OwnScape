import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useAppTheme } from '@/hooks/use-app-theme'

type Props = {
  label: string
  value: string
  options: string[]
  onChange: (color: string) => void
}

export default function ColorPicker({ label, value, options, onChange }: Props) {
  const { colors } = useAppTheme()
  const [hex, setHex] = useState(value)

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={styles.swatchRow}>
        {options.map((swatch) => {
          const isActive = swatch.toUpperCase() === value.toUpperCase()
          return (
            <Pressable
              key={swatch}
              style={[
                styles.swatch,
                { backgroundColor: swatch },
                isActive && { borderColor: colors.text, borderWidth: 3 },
                !isActive && { borderColor: colors.border, borderWidth: 2 },
              ]}
              onPress={() => { setHex(swatch); onChange(swatch) }}
            />
          )
        })}
      </View>
      <View style={styles.hexRow}>
        <Text style={[styles.hash, { color: colors.textSecondary }]}>#</Text>
        <TextInput
          style={[styles.hexInput, { backgroundColor: colors.grayLight, borderColor: colors.border, color: colors.text }]}
          value={hex.replace('#', '')}
          onChangeText={(t) => {
            const clean = t.replace(/[^0-9a-fA-F]/g, '').slice(0, 6)
            setHex(`#${clean}`)
          }}
          onEndEditing={() => {
            const full = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex
            if (/^#[0-9a-fA-F]{6}$/.test(full)) {
              onChange(full)
            } else {
              setHex(value)
            }
          }}
          placeholder="000000"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          maxLength={6}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%', marginBottom: 20,
  },
  label: {
    fontSize: 12, fontWeight: '900', marginBottom: 10, letterSpacing: 0.5,
  },
  swatchRow: {
    flexDirection: 'row', gap: 10, marginBottom: 10,
  },
  swatch: {
    width: 38, height: 38, borderRadius: 8,
    boxShadow: '2px 2px 0px #000', elevation: 2,
  },
  hexRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  hash: {
    fontSize: 16, fontWeight: '900',
  },
  hexInput: {
    flex: 1, borderWidth: 2, borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'],
  },
})
