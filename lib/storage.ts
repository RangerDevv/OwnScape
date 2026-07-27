import * as ImagePicker from 'expo-image-picker'
import { supabase } from './supabase'

export async function pickAndUploadImage(userId: string): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!permission.granted) {
    alert('Camera roll permission is required to pick an image.')
    return null
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.7,
  })

  if (result.canceled || !result.assets?.[0]) return null

  const asset = result.assets[0]
  const ext = asset.fileName?.split('.').pop() || 'jpg'
  const fileName = `${userId}/${Date.now()}.${ext}`

  try {
    const response = await fetch(asset.uri)
    const blob = await response.blob()

    const { error } = await supabase.storage
      .from('post-images')
      .upload(fileName, blob, { contentType: asset.mimeType || 'image/jpeg' })

    if (!error) {
      const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(fileName)
      return urlData?.publicUrl || null
    }
  } catch {
    // fallback to local uri
  }

  return asset.uri || null
}
