import { Image, type ImageStyle, type StyleProp, Text, View, type ViewStyle } from 'react-native'

type Props = {
  avatarUrl?: string | null
  name?: string | null
  handle?: string
  size?: number
  borderColor?: string
  style?: StyleProp<ViewStyle | ImageStyle>
}

export default function UserAvatar({ avatarUrl, name, handle, size = 40, borderColor = '#000', style }: Props) {
  const letter = (name || handle || 'U').charAt(0).toUpperCase()
  const borderRadius = Math.round(size * 0.18)

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[
          {
            width: size, height: size, borderRadius,
            borderWidth: 2, borderColor,
          },
          style,
        ] as ImageStyle}
      />
    )
  }

  return (
    <View
      style={[
        {
          width: size, height: size, borderRadius,
          backgroundColor: '#ffe600',
          alignItems: 'center', justifyContent: 'center',
          borderWidth: 2, borderColor,
        },
        style,
      ] as any}
    >
      <Text style={{ color: '#000', fontSize: size * 0.4, fontWeight: '900' }}>
        {letter}
      </Text>
    </View>
  )
}
