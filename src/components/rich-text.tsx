import { Text, type TextProps } from 'react-native'

type Props = Omit<TextProps, 'children'> & {
  text: string
  onHashtagPress?: (tag: string) => void
  onMentionPress?: (handle: string) => void
  mentionStyle?: TextProps['style']
  hashtagStyle?: TextProps['style']
}

const TAG_RE = /(@\w+|#\w+)/g

export function RichText({ text, onHashtagPress, onMentionPress, mentionStyle, hashtagStyle, style, ...props }: Props) {
  const parts = text.split(TAG_RE)
  const matches = text.match(TAG_RE) ?? []

  if (matches.length === 0) {
    return <Text style={style} {...props}>{text}</Text>
  }

  const elements: React.ReactNode[] = []
  for (let i = 0; i < parts.length; i++) {
    if (parts[i]) {
      elements.push(<Text key={`t${i}`}>{parts[i]}</Text>)
    }
    if (i < matches.length) {
      const token = matches[i]
      if (token.startsWith('@')) {
        elements.push(
          <Text
            key={`m${i}`}
            style={[{ fontWeight: '700' }, mentionStyle]}
            onPress={() => onMentionPress?.(token)}
          >
            {token}
          </Text>
        )
      } else {
        elements.push(
          <Text
            key={`h${i}`}
            style={[{ fontWeight: '700' }, hashtagStyle]}
            onPress={() => onHashtagPress?.(token)}
          >
            {token}
          </Text>
        )
      }
    }
  }

  return <Text style={style} {...props}>{elements}</Text>
}
