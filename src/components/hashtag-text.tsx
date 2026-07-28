import { Text, type TextProps } from 'react-native'

type Props = Omit<TextProps, 'children'> & {
  text: string
  onHashtagPress?: (tag: string) => void
  hashtagStyle?: TextProps['style']
}

const TAG_RE = /#\w+/g

export function HashtagText({ text, onHashtagPress, hashtagStyle, style, ...props }: Props) {
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
      const tag = matches[i]
      elements.push(
        <Text
          key={`m${i}`}
          style={[{ fontWeight: '700' }, hashtagStyle]}
          onPress={() => onHashtagPress?.(tag)}
        >
          {tag}
        </Text>
      )
    }
  }

  return <Text style={style} {...props}>{elements}</Text>
}
